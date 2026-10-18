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
  const parts = [sql`true`];
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
             p.pattern, c.key as colour_key, c.name as colour_name, c.palette, c.images->>0 as image, i.size, i.quantity,
             coalesce(op.reserved, 0) as reserved, coalesce(op.sold, 0) as sold,
             c.price_pesewas, c.sale_pesewas, i.updated_at,
             coalesce(array_position(array(select jsonb_array_elements_text(c.sizes)), i.size), 99) as size_order
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

// Shop-wide totals for the header and stat cards (all products, no filters).
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
    where true
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

// ---------- One row per product ----------

export type ProductStockRow = {
  productId: string;
  productName: string;
  published: boolean;
  pattern: string;
  status: string;
  firstPalette: [string, string, string];
  firstImage: string | null;
  firstColourKey: string;
  firstColourName: string;
  colours: number;
  variants: number;
  available: number;
  reserved: number;
  sold: number;
  low: number;
  out: number;
  minPesewas: number | null;
  maxPesewas: number | null;
};

const productOrderBy: Record<InventorySort, ReturnType<typeof sql>> = {
  updated: sql`max(i.updated_at) desc, p.name asc`,
  name: sql`p.name asc`,
  "stock-asc": sql`sum(i.quantity) asc, p.name asc`,
  "stock-desc": sql`sum(i.quantity) desc, p.name asc`,
};

// Tracked products with totals across their variants. Search matches a product when any of its
// variants match; stock level "low"/"out" means at least one size is low/out, "in" means none are.
export async function listInventoryProducts(f: InventoryFilters) {
  const pageSize = f.pageSize ?? 20;
  const page = Math.max(1, f.page ?? 1);
  const variantFilters = where({ ...f, level: "all" });
  const having =
    f.level === "low"
      ? sql`having count(*) filter (where i.quantity between 1 and ${LOW_INVENTORY}) > 0`
      : f.level === "out"
        ? sql`having count(*) filter (where i.quantity = 0) > 0`
        : f.level === "in"
          ? sql`having count(*) filter (where i.quantity <= ${LOW_INVENTORY}) = 0`
          : sql``;

  // Products with at least one matching variant; totals cover all their variants.
  const matching = sql`
    select distinct p.id
    from ${schema.inventory} i
    join ${schema.colourways} c on c.id = i.colourway_id
    join ${schema.products} p on p.id = c.product_id
    where ${variantFilters}
  `;
  const grouped = sql`
    from ${schema.inventory} i
    join ${schema.colourways} c on c.id = i.colourway_id
    join ${schema.products} p on p.id = c.product_id
    left join (${orderPieces}) op on op.slug = p.slug and op.colour_key = c.key and op.size = i.size
    where p.id in (${matching})
    group by p.id
    ${having}
  `;

  const [rows, [{ total }]] = await Promise.all([
    db.execute<Record<string, unknown>>(sql`
      select p.id as product_id, p.name as product_name, p.published, p.pattern, p.status,
             (array_agg(c.palette order by c.position))[1] as first_palette,
             (array_agg(c.images->>0 order by c.position))[1] as first_image,
             (array_agg(c.key order by c.position))[1] as first_colour_key,
             (array_agg(c.name order by c.position))[1] as first_colour_name,
             count(distinct c.id)::int as colours,
             count(*)::int as variants,
             coalesce(sum(i.quantity), 0)::int as available,
             coalesce(sum(op.reserved), 0)::int as reserved,
             coalesce(sum(op.sold), 0)::int as sold,
             count(*) filter (where i.quantity between 1 and ${LOW_INVENTORY})::int as low,
             count(*) filter (where i.quantity = 0)::int as out,
             min(coalesce(c.sale_pesewas, c.price_pesewas)) as min_price,
             max(coalesce(c.sale_pesewas, c.price_pesewas)) as max_price
      ${grouped}
      order by ${productOrderBy[f.sort ?? "name"]}
      limit ${pageSize} offset ${(page - 1) * pageSize}
    `),
    db.execute<{ total: number }>(sql`select count(*)::int as total from (select p.id ${grouped}) t`),
  ]);

  const products: ProductStockRow[] = [...rows].map((r) => ({
    productId: r.product_id as string,
    productName: r.product_name as string,
    published: r.published as boolean,
    pattern: r.pattern as string,
    status: r.status as string,
    firstPalette: r.first_palette as [string, string, string],
    firstImage: (r.first_image as string | null) ?? null,
    firstColourKey: r.first_colour_key as string,
    firstColourName: r.first_colour_name as string,
    colours: Number(r.colours),
    variants: Number(r.variants),
    available: Number(r.available),
    reserved: Number(r.reserved),
    sold: Number(r.sold),
    low: Number(r.low),
    out: Number(r.out),
    minPesewas: r.min_price == null ? null : Number(r.min_price),
    maxPesewas: r.max_price == null ? null : Number(r.max_price),
  }));
  return { products, total: Number(total), page, pageCount: Math.ceil(Number(total) / pageSize) };
}
