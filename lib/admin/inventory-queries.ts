import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { LOW_INVENTORY } from "../products";

// Inventory as a list of variants (one colour in one size), like a stock sheet.
// "Reserved" = pieces in open orders (taken from inventory, not yet delivered); "sold" = delivered.

export type VariantRow = {
  inventoryId: string;
  productId: string;
  productName: string;
  productSlug: string;
  published: boolean;
  pattern: string;
  colourKey: string;
  colourName: string;
  palette: [string, string, string];
  image: string | null;
  size: string;
  quantity: number;
  reserved: number;
  sold: number;
  pricePesewas: number | null;
  salePesewas: number | null;
  updatedAt: Date;
};

export const stockLevels = ["all", "in", "low", "out"] as const;
export type StockLevel = (typeof stockLevels)[number];
export const inventorySorts = ["updated", "name", "stock-asc", "stock-desc"] as const;
export type InventorySort = (typeof inventorySorts)[number];

export type InventoryFilters = {
  q?: string;
  level?: StockLevel;
  status?: "all" | "published" | "draft";
  productId?: string;
  sort?: InventorySort;
  page?: number;
  pageSize?: number;
};

// Pieces per variant in open and delivered orders that took inventory.
const orderPieces = sql`
  select item->>'slug' as slug, item->>'colourKey' as colour_key, item->>'size' as size,
         sum(case when o.status in ('new', 'confirmed', 'paid', 'made') then (item->>'qty')::int else 0 end)::int as reserved,
         sum(case when o.status = 'delivered' then (item->>'qty')::int else 0 end)::int as sold
  from ${schema.orders} o, jsonb_array_elements(o.items) as item
  where (item->>'inventoryTaken')::boolean is true
  group by 1, 2, 3
`;

function where(f: InventoryFilters) {
  const parts = [sql`p.track_inventory = true`];
  if (f.productId) parts.push(sql`p.id = ${f.productId}`);
  if (f.status === "published") parts.push(sql`p.published = true`);
  if (f.status === "draft") parts.push(sql`p.published = false`);
  if (f.level === "in") parts.push(sql`i.quantity > ${LOW_INVENTORY}`);
  if (f.level === "low") parts.push(sql`i.quantity between 1 and ${LOW_INVENTORY}`);
  if (f.level === "out") parts.push(sql`i.quantity = 0`);
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    parts.push(sql`(p.name ilike ${like} or c.name ilike ${like} or i.size ilike ${like})`);
  }
  return sql.join(parts, sql` and `);
}

const orderBy: Record<InventorySort, ReturnType<typeof sql>> = {
  updated: sql`i.updated_at desc, p.name asc`,
  name: sql`p.name asc, c.position asc, size_order asc`,
  "stock-asc": sql`i.quantity asc, p.name asc, size_order asc`,
  "stock-desc": sql`i.quantity desc, p.name asc, size_order asc`,
};

export async function listInventory(f: InventoryFilters) {
  const pageSize = f.pageSize ?? 25;
  const page = Math.max(1, f.page ?? 1);
  const base = sql`
    from ${schema.inventory} i
    join ${schema.colourways} c on c.id = i.colourway_id
    join ${schema.products} p on p.id = c.product_id
    left join (${orderPieces}) op on op.slug = p.slug and op.colour_key = c.key and op.size = i.size
    where ${where(f)}
  `;
  const [rows, [{ total }]] = await Promise.all([
    db.execute<Record<string, unknown>>(sql`
      select i.id as inventory_id, p.id as product_id, p.name as product_name, p.slug as product_slug, p.published,
             p.pattern, c.key as colour_key, c.name as colour_name, c.palette, c.image, i.size, i.quantity,
             coalesce(op.reserved, 0) as reserved, coalesce(op.sold, 0) as sold,
             c.price_pesewas, c.sale_pesewas, i.updated_at,
             coalesce(array_position(array(select jsonb_array_elements_text(p.sizes)), i.size), 99) as size_order
      ${base}
      order by ${orderBy[f.sort ?? "name"]}
      limit ${pageSize} offset ${(page - 1) * pageSize}
    `),
    db.execute<{ total: number }>(sql`select count(*)::int as total ${base}`),
  ]);

  const variants: VariantRow[] = [...rows].map((r) => ({
    inventoryId: r.inventory_id as string,
    productId: r.product_id as string,
    productName: r.product_name as string,
    productSlug: r.product_slug as string,
    published: r.published as boolean,
    pattern: r.pattern as string,
    colourKey: r.colour_key as string,
    colourName: r.colour_name as string,
    palette: r.palette as [string, string, string],
    image: (r.image as string | null) ?? null,
    size: r.size as string,
    quantity: Number(r.quantity),
    reserved: Number(r.reserved),
    sold: Number(r.sold),
    pricePesewas: r.price_pesewas == null ? null : Number(r.price_pesewas),
    salePesewas: r.sale_pesewas == null ? null : Number(r.sale_pesewas),
    updatedAt: new Date(r.updated_at as string),
  }));
  return { variants, total, page, pageCount: Math.ceil(total / pageSize) };
}

// Shop-wide totals for the header and stat cards (all tracked products, no filters).
export async function getInventoryTotals() {
  const [r] = await db.execute<{
    available: number;
    reserved: number;
    sold: number;
    low: number;
    out: number;
    variants: number;
    value: number;
  }>(sql`
    select coalesce(sum(i.quantity), 0)::int as available,
           coalesce(sum(op.reserved), 0)::int as reserved,
           coalesce(sum(op.sold), 0)::int as sold,
           count(*) filter (where i.quantity between 1 and ${LOW_INVENTORY})::int as low,
           count(*) filter (where i.quantity = 0)::int as out,
           count(*)::int as variants,
           coalesce(sum(i.quantity::bigint * coalesce(c.sale_pesewas, c.price_pesewas, 0)), 0)::bigint as value
    from ${schema.inventory} i
    join ${schema.colourways} c on c.id = i.colourway_id
    join ${schema.products} p on p.id = c.product_id
    left join (${orderPieces}) op on op.slug = p.slug and op.colour_key = c.key and op.size = i.size
    where p.track_inventory = true
  `);
  return {
    available: Number(r.available),
    reserved: Number(r.reserved),
    sold: Number(r.sold),
    low: Number(r.low),
    out: Number(r.out),
    variants: Number(r.variants),
    valuePesewas: Number(r.value),
  };
}

// History for one variant, newest first.
export async function getVariantMovements(inventoryId: string, limit = 50) {
  const [inv] = await db
    .select({ colourwayId: schema.inventory.colourwayId, size: schema.inventory.size })
    .from(schema.inventory)
    .where(eq(schema.inventory.id, inventoryId));
  if (!inv) return [];
  const m = schema.inventoryMovements;
  return db
    .select()
    .from(m)
    .where(and(eq(m.colourwayId, inv.colourwayId), eq(m.size, inv.size)))
    .orderBy(desc(m.createdAt), desc(m.id))
    .limit(limit);
}

// Products that match a search but don't track inventory, so the page can offer to start.
export async function findUntracked(q: string) {
  const term = q.trim();
  if (!term) return [];
  const like = `%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  return db
    .select({ id: schema.products.id, name: schema.products.name, published: schema.products.published, status: schema.products.status })
    .from(schema.products)
    .where(and(eq(schema.products.trackInventory, false), sql`${schema.products.name} ilike ${like}`))
    .orderBy(schema.products.name)
    .limit(10);
}
