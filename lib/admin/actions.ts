"use server";

import { and, eq, inArray, min, notInArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { PRODUCTS_TAG, toPesewas } from "../catalog";
import { db, schema } from "../db";
import { applyMovement, InventoryShortage, moveOrderInventory, syncInventoryRows } from "../inventory";
import { categories } from "../products";
import { saveSettings as writeSettings, SETTINGS_TAG } from "../settings";
import { settingsSchema, type ShopSettings } from "../settings-schema";
import { productInput, publishProblem, type ProductInput } from "./product-schema";
import { orderStatuses } from "./order-status";
import { requireAdmin } from "./session";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; field?: string };

function firstIssue(error: z.ZodError): { ok: false; error: string; field?: string } {
  const issue = error.issues[0];
  return { ok: false, error: issue?.message ?? "Please check the form", field: issue?.path.join(".") };
}

// ---------- Orders ----------

// Cancelling gives the order's pieces back to inventory; reopening a cancelled order takes them again.
export async function setOrderStatus(ref: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ ref: z.string().max(40), status: z.enum(orderStatuses) }).safeParse({ ref, status });
  if (!parsed.success) return firstIssue(parsed.error);
  const next = parsed.data.status;
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ status: schema.orders.status, items: schema.orders.items })
        .from(schema.orders)
        .where(eq(schema.orders.ref, parsed.data.ref))
        .for("update");
      if (!order) return { found: false, moved: false };
      let moved = false;
      if (next === "cancelled" && order.status !== "cancelled") moved = await moveOrderInventory(tx, parsed.data.ref, order.items, "cancel");
      if (next !== "cancelled" && order.status === "cancelled") moved = await moveOrderInventory(tx, parsed.data.ref, order.items, "reopen");
      await tx.update(schema.orders).set({ status: next }).where(eq(schema.orders.ref, parsed.data.ref));
      return { found: true, moved };
    });
    if (!result.found) return { ok: false, error: "Order not found" };
    if (result.moved) updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (e) {
    if (e instanceof InventoryShortage) return { ok: false, error: `Can't reopen this order: ${e.message}` };
    throw e;
  }
}

// ---------- Products ----------

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = productInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const p = parsed.data;
  if (!categories.some((c) => c.slug === p.category)) return { ok: false, error: "Choose a category", field: "category" };
  if (p.published) {
    const problem = publishProblem(p);
    if (problem) return { ok: false, error: problem };
  }

  const clash = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.slug, p.slug))
    .limit(1);
  if (clash[0] && clash[0].id !== p.id) {
    return { ok: false, error: "Another product already uses this web address", field: "slug" };
  }

  const fields = {
    slug: p.slug,
    name: p.name,
    category: p.category,
    collection: p.collection,
    pattern: p.pattern,
    status: p.status,
    description: p.description,
    details: p.details,
    sizes: p.sizes,
    featured: p.featured,
    published: p.published,
    trackInventory: p.trackInventory,
  };

  const id = await db.transaction(async (tx) => {
    let productId = p.id;
    if (productId) {
      const updated = await tx
        .update(schema.products)
        .set(fields)
        .where(eq(schema.products.id, productId))
        .returning({ id: schema.products.id });
      if (!updated.length) throw new Error("Product not found");
    } else {
      // New products go to the front of the shop.
      const [first] = await tx.select({ position: min(schema.products.position) }).from(schema.products);
      const [row] = await tx
        .insert(schema.products)
        .values({ ...fields, position: (first?.position ?? 0) - 1 })
        .returning({ id: schema.products.id });
      productId = row.id;
    }

    // Colourways are replaced as a set: keep listed keys (updating them), drop the rest.
    const keys = p.colourways.map((c) => c.key);
    await tx
      .delete(schema.colourways)
      .where(and(eq(schema.colourways.productId, productId), notInArray(schema.colourways.key, keys)));
    for (const [position, c] of p.colourways.entries()) {
      const values = {
        name: c.name,
        pricePesewas: c.price == null ? null : toPesewas(c.price),
        salePesewas: c.salePrice == null ? null : toPesewas(c.salePrice),
        palette: c.palette,
        image: c.image,
        soldOut: c.soldOut,
        position,
      };
      await tx
        .insert(schema.colourways)
        .values({ productId, key: c.key, ...values })
        .onConflictDoUpdate({ target: [schema.colourways.productId, schema.colourways.key], set: values });
    }
    if (p.trackInventory) await syncInventoryRows(tx, productId, p.sizes);
    return productId;
  });

  updateTag(PRODUCTS_TAG);
  return { ok: true, data: { id, slug: p.slug } };
}

export async function setProductPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Product not found" };
  if (published) {
    const [product] = await db.select({ sizes: schema.products.sizes }).from(schema.products).where(eq(schema.products.id, id));
    if (!product) return { ok: false, error: "Product not found" };
    const cws = await db
      .select({ name: schema.colourways.name, price: schema.colourways.pricePesewas })
      .from(schema.colourways)
      .where(eq(schema.colourways.productId, id));
    const problem = publishProblem({ sizes: product.sizes, colourways: cws });
    if (problem) return { ok: false, error: problem };
  }
  await db.update(schema.products).set({ published }).where(eq(schema.products.id, id));
  updateTag(PRODUCTS_TAG);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Product not found" };
  // Orders keep their own copy of names and prices, so deleting a product never changes past orders.
  await db.delete(schema.products).where(eq(schema.products.id, id));
  updateTag(PRODUCTS_TAG);
  return { ok: true };
}

// ---------- Inventory ----------

const inventoryInput = z.object({
  productId: z.string().uuid(),
  // "receive" adds new pieces; "count" sets what's actually on the shelf.
  mode: z.enum(["receive", "count"]),
  note: z.string().trim().max(200),
  entries: z
    .array(z.object({ colourKey: z.string().max(60), size: z.string().max(12), quantity: z.number().int().min(0).max(10_000) }))
    .max(200),
});

export async function updateInventory(input: z.infer<typeof inventoryInput>): Promise<ActionResult<{ changed: number }>> {
  await requireAdmin();
  const parsed = inventoryInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { productId, mode, note, entries } = parsed.data;
  if (mode === "count" && !note) return { ok: false, error: "Say why the counts changed, e.g. “Stock count” or “2 damaged”.", field: "note" };

  const changed = await db.transaction(async (tx) => {
    const [product] = await tx
      .select({ trackInventory: schema.products.trackInventory, sizes: schema.products.sizes })
      .from(schema.products)
      .where(eq(schema.products.id, productId));
    if (!product?.trackInventory) return -1;
    const cws = await tx
      .select({ id: schema.colourways.id, key: schema.colourways.key })
      .from(schema.colourways)
      .where(eq(schema.colourways.productId, productId));
    const current = await tx.select().from(schema.inventory).where(inArray(schema.inventory.colourwayId, cws.map((c) => c.id)));

    let n = 0;
    for (const e of entries) {
      const cw = cws.find((c) => c.key === e.colourKey);
      if (!cw || !product.sizes.includes(e.size)) continue;
      const now = current.find((r) => r.colourwayId === cw.id && r.size === e.size)?.quantity ?? 0;
      const change = mode === "receive" ? e.quantity : e.quantity - now;
      if (change === 0) continue;
      await applyMovement(tx, { colourwayId: cw.id, size: e.size, change, reason: mode === "receive" ? "restock" : "adjust", note });
      n++;
    }
    return n;
  });

  if (changed === -1) return { ok: false, error: "Turn on “Track inventory” for this product first." };
  if (changed > 0) updateTag(PRODUCTS_TAG);
  return { ok: true, data: { changed } };
}

// ---------- Settings ----------

export async function saveShopSettings(input: ShopSettings): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  await writeSettings(parsed.data);
  updateTag(SETTINGS_TAG);
  return { ok: true };
}
