import "server-only";
import { asc, desc } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db, schema } from "./db";
import type { CategorySlug, Colourway, Pattern, Product } from "./products";

export const PRODUCTS_TAG = "products";

type ProductRow = typeof schema.products.$inferSelect;
type ColourwayRow = typeof schema.colourways.$inferSelect;

export function toCedis(pesewas: number) {
  return pesewas / 100;
}

export function toPesewas(cedis: number) {
  return Math.round(cedis * 100);
}

function toColourway(c: ColourwayRow, inventory?: Record<string, number>): Colourway {
  return {
    id: c.key,
    name: c.name,
    // Only drafts can lack a price; 0 means "not set" and never reaches the shop.
    price: c.pricePesewas == null ? 0 : toCedis(c.pricePesewas),
    salePrice: c.salePesewas == null ? undefined : toCedis(c.salePesewas),
    palette: c.palette,
    sizes: c.sizes,
    images: c.images.length ? c.images : undefined,
    soldOut: c.soldOut || undefined,
    inventory,
  };
}

function toProduct(p: ProductRow, cws: ColourwayRow[], stock: Map<string, Record<string, number>>): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category as CategorySlug,
    collection: p.collection,
    pattern: p.pattern as Pattern,
    status: p.status,
    description: p.description,
    details: p.details,
    colourways: cws.map((c) => toColourway(c, stock.get(c.id) ?? {})),
    featured: p.featured || undefined,
    draft: !p.published || undefined,
    createdAt: p.createdAt.toISOString().slice(0, 10),
  };
}

// Every product with its colourways, in shop order. Not cached: the admin needs fresh data.
export async function loadAllProducts(): Promise<Product[]> {
  const [rows, cws, inv] = await Promise.all([
    db.select().from(schema.products).orderBy(asc(schema.products.position), desc(schema.products.createdAt)),
    db.select().from(schema.colourways).orderBy(asc(schema.colourways.position)),
    db.select().from(schema.inventory),
  ]);
  const stock = new Map<string, Record<string, number>>();
  for (const i of inv) stock.set(i.colourwayId, { ...stock.get(i.colourwayId), [i.size]: i.quantity });
  const byProduct = new Map<string, ColourwayRow[]>();
  for (const c of cws) byProduct.set(c.productId, [...(byProduct.get(c.productId) ?? []), c]);
  // Products without a colourway can't be bought or drawn, so they stay out of the shop.
  return rows.map((r) => toProduct(r, byProduct.get(r.id) ?? [], stock));
}

// What the shop shows: published products that have at least one colourway. Cached until the admin edits.
export async function getShopProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  const all = await loadAllProducts();
  return all.filter((p) => !p.draft && p.colourways.length > 0);
}

export async function getShopProduct(slug: string) {
  const all = await getShopProducts();
  return all.find((p) => p.slug === slug);
}
