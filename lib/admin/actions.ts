"use server";

import { and, eq, min, notInArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { PRODUCTS_TAG, toPesewas } from "../catalog";
import { db, schema } from "../db";
import { categories } from "../products";
import { saveSettings as writeSettings, SETTINGS_TAG } from "../settings";
import { settingsSchema, type ShopSettings } from "../settings-schema";
import { productInput, type ProductInput } from "./product-schema";
import { orderStatuses } from "./order-status";
import { requireAdmin } from "./session";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; field?: string };

function firstIssue(error: z.ZodError): { ok: false; error: string; field?: string } {
  const issue = error.issues[0];
  return { ok: false, error: issue?.message ?? "Please check the form", field: issue?.path.join(".") };
}

// ---------- Orders ----------

export async function setOrderStatus(ref: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ ref: z.string().max(40), status: z.enum(orderStatuses) }).safeParse({ ref, status });
  if (!parsed.success) return firstIssue(parsed.error);
  const updated = await db
    .update(schema.orders)
    .set({ status: parsed.data.status })
    .where(eq(schema.orders.ref, parsed.data.ref))
    .returning({ ref: schema.orders.ref });
  return updated.length ? { ok: true } : { ok: false, error: "Order not found" };
}

// ---------- Products ----------

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();
  const parsed = productInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const p = parsed.data;
  if (!categories.some((c) => c.slug === p.category)) return { ok: false, error: "Choose a category", field: "category" };

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
    hidden: p.hidden,
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
        pricePesewas: toPesewas(c.price),
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
    return productId;
  });

  updateTag(PRODUCTS_TAG);
  return { ok: true, data: { id, slug: p.slug } };
}

export async function setProductHidden(id: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Product not found" };
  await db.update(schema.products).set({ hidden }).where(eq(schema.products.id, id));
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

// ---------- Settings ----------

export async function saveShopSettings(input: ShopSettings): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  await writeSettings(parsed.data);
  updateTag(SETTINGS_TAG);
  return { ok: true };
}
