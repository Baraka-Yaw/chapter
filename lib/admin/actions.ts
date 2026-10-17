"use server";

import { and, eq, min, notInArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { PRODUCTS_TAG, toPesewas } from "../catalog";
import { db, schema } from "../db";
import { applyMovement, InventoryShortage, moveOrderInventory, syncInventoryRows } from "../inventory";
import { categories } from "../products";
import { saveSettings as writeSettings, SETTINGS_TAG } from "../settings";
import { settingsSchema, type ShopSettings } from "../settings-schema";
import { getVariantMovements, listInventory } from "./inventory-queries";
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
    // Every colour × size gets an inventory row (new ones start at 0).
    await syncInventoryRows(tx, productId, p.sizes);
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

const variantId = z.string().uuid();

async function variantFor(inventoryId: string) {
  const [row] = await db
    .select({ colourwayId: schema.inventory.colourwayId, size: schema.inventory.size, quantity: schema.inventory.quantity })
    .from(schema.inventory)
    .where(eq(schema.inventory.id, inventoryId));
  return row;
}

const restockInput = z.object({
  inventoryId: variantId,
  quantity: z.number().int().min(1, "Enter how many pieces arrived").max(10_000),
  reference: z.string().trim().max(60),
  note: z.string().trim().max(200),
});

// New pieces arrived for one variant.
export async function restockVariant(input: z.infer<typeof restockInput>): Promise<ActionResult<{ quantity: number }>> {
  await requireAdmin();
  const parsed = restockInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { inventoryId, quantity, reference, note } = parsed.data;
  const v = await variantFor(inventoryId);
  if (!v) return { ok: false, error: "This size no longer exists." };
  const after = await db.transaction((tx) =>
    applyMovement(tx, {
      colourwayId: v.colourwayId,
      size: v.size,
      change: quantity,
      reason: "restock",
      note: [reference && `Ref ${reference}`, note].filter(Boolean).join(" · "),
    }),
  );
  updateTag(PRODUCTS_TAG);
  return { ok: true, data: { quantity: after } };
}

const adjustInput = z.object({
  inventoryId: variantId,
  type: z.enum(["increase", "decrease", "set"]),
  quantity: z.number().int().min(0).max(10_000),
  note: z.string().trim().min(3, "Explain the change, e.g. “2 damaged” or “Stock count”").max(200),
});

// Corrections: found extra pieces, damaged or given away, or a stock count.
export async function adjustVariant(input: z.infer<typeof adjustInput>): Promise<ActionResult<{ quantity: number }>> {
  await requireAdmin();
  const parsed = adjustInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { inventoryId, type, quantity, note } = parsed.data;
  const v = await variantFor(inventoryId);
  if (!v) return { ok: false, error: "This size no longer exists." };
  const change = type === "increase" ? quantity : type === "decrease" ? -quantity : quantity - v.quantity;
  if (change === 0) return { ok: false, error: type === "set" ? `It's already ${v.quantity}.` : "Enter a quantity." };
  try {
    const after = await db.transaction((tx) =>
      applyMovement(tx, { colourwayId: v.colourwayId, size: v.size, change, reason: "adjust", note }),
    );
    updateTag(PRODUCTS_TAG);
    return { ok: true, data: { quantity: after } };
  } catch (e) {
    if (e instanceof InventoryShortage) return { ok: false, error: `You can't remove more than the ${e.available} in stock.` };
    throw e;
  }
}

// All variants of one product, for the inventory dialog.
export async function loadProductVariants(productId: string) {
  await requireAdmin();
  if (!variantId.safeParse(productId).success) return [];
  return (await listInventory({ productId, pageSize: 500 })).variants;
}

export async function loadVariantMovements(inventoryId: string) {
  await requireAdmin();
  if (!variantId.safeParse(inventoryId).success) return [];
  return getVariantMovements(inventoryId);
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
