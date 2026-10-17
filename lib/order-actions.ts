"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { updateTag } from "next/cache";
import { getShopProducts, PRODUCTS_TAG, toCedis, toPesewas } from "./catalog";
import { db, schema } from "./db";
import type { OrderItem } from "./db/schema";
import { InventoryShortage, takeForOrder } from "./inventory";
import { effectivePrice } from "./products";
import { getSettings } from "./settings";
import { orderMessage, waLink } from "./whatsapp";

const orderInput = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().max(120),
        colourwayId: z.string().max(80),
        size: z.string().max(20),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your bag is empty")
    .max(30),
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ ]{9,16}$/, "Please enter a valid phone number"),
  zoneId: z.string().max(40),
  address: z.string().trim().max(200),
  payment: z.string().max(40),
  note: z.string().trim().max(500),
  // Hidden field real customers never fill; bots usually do.
  website: z.string().max(0).optional(),
});

export type PlaceOrderInput = z.infer<typeof orderInput>;
export type PlaceOrderResult = { ok: true; ref: string; waUrl: string } | { ok: false; error: string };

function newRef() {
  const now = new Date();
  const date = `${now.getUTCFullYear() % 100}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  return `CO-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

// Saves the order with prices from the database, then returns the WhatsApp link that sends it.
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = orderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details" };
  const o = parsed.data;

  const [settings, products] = await Promise.all([getSettings(), getShopProducts()]);
  const zone = settings.deliveryZones.find((z) => z.id === o.zoneId);
  if (!zone) return { ok: false, error: "Please choose a delivery area" };
  if (!settings.paymentOptions.includes(o.payment)) return { ok: false, error: "Please choose how you'd like to pay" };

  const items: OrderItem[] = [];
  for (const i of o.items) {
    const product = products.find((p) => p.slug === i.slug);
    const colourway = product?.colourways.find((c) => c.id === i.colourwayId);
    if (!product || !colourway) return { ok: false, error: "Something in your bag is no longer available. Please remove it and try again." };
    if (product.status === "coming-soon") return { ok: false, error: `${product.name} isn't available to order yet.` };
    if (colourway.soldOut) return { ok: false, error: `${product.name} in ${colourway.name} is sold out.` };
    if (!product.sizes.includes(i.size)) return { ok: false, error: `Please choose a size for ${product.name} again.` };
    items.push({
      slug: product.slug,
      name: product.name,
      colourKey: colourway.id,
      colour: colourway.name,
      size: i.size,
      qty: i.qty,
      unitPesewas: toPesewas(effectivePrice(colourway)),
      preorder: product.status === "preorder",
    });
  }

  const subtotalPesewas = items.reduce((n, i) => n + i.unitPesewas * i.qty, 0);
  const deliveryPesewas = toPesewas(zone.fee);
  const values = {
    customerName: o.customerName,
    phone: o.phone,
    zoneId: zone.id,
    zoneLabel: zone.label,
    deliveryPesewas,
    address: o.address,
    payment: o.payment,
    note: o.note,
    items,
    subtotalPesewas,
    totalPesewas: subtotalPesewas + deliveryPesewas,
  };

  // The order and the inventory it takes commit together: a shortage saves nothing.
  const tracked = new Set(products.filter((p) => p.trackInventory).map((p) => p.slug));
  const save = (ref: string) =>
    db.transaction(async (tx) => {
      const taken = await takeForOrder(tx, ref, items, tracked);
      await tx.insert(schema.orders).values({ ...values, items: taken, ref });
    });

  let ref = newRef();
  try {
    try {
      await save(ref);
    } catch (e) {
      if (e instanceof InventoryShortage) throw e;
      // A reference clash is astronomically unlikely, but retry once rather than fail the customer.
      ref = newRef();
      await save(ref);
    }
  } catch (e) {
    if (e instanceof InventoryShortage) {
      return { ok: false, error: `${e.message} Please change your bag and try again.` };
    }
    throw e;
  }
  // Pieces left changed, so the shop shows fresh numbers.
  if (items.some((i) => tracked.has(i.slug))) updateTag(PRODUCTS_TAG);

  const text = orderMessage({
    ref,
    lines: items.map((i) => ({ name: i.name, colour: i.colour, size: i.size, qty: i.qty, unitPrice: toCedis(i.unitPesewas), preorder: i.preorder })),
    subtotal: toCedis(subtotalPesewas),
    deliveryFee: zone.fee,
    zoneLabel: zone.label,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    payment: o.payment,
    note: o.note,
  });
  return { ok: true, ref, waUrl: waLink(settings.whatsapp, text) };
}
