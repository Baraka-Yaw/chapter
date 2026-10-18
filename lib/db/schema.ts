import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Money columns are whole pesewas (GH₵1 = 100) so sums never drift.

export const productStatus = pgEnum("product_status", ["available", "preorder", "coming-soon"]);
export const orderStatus = pgEnum("order_status", ["new", "confirmed", "paid", "made", "delivered", "cancelled"]);
export const inventoryReason = pgEnum("inventory_reason", ["order", "cancel", "reopen", "restock", "adjust"]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  category: text().notNull(),
  collection: text().notNull().default(""),
  // Drawn placeholder print, used when a colourway has no photo.
  pattern: text().notNull().default("plain"),
  status: productStatus().notNull().default("available"),
  description: text().notNull().default(""),
  details: jsonb().$type<string[]>().notNull().default([]),
  featured: boolean().notNull().default(false),
  // Drafts stay out of the shop and may be incomplete; publishing checks the product is ready.
  published: boolean().notNull().default(false),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const colourways = pgTable(
  "colourways",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Stable short id used in carts and URLs, e.g. "black-white".
    key: text().notNull(),
    name: text().notNull(),
    // Null only on drafts, while the price isn't decided yet.
    pricePesewas: integer(),
    salePesewas: integer(),
    palette: jsonb().$type<[string, string, string]>().notNull(),
    // Sizes this colour comes in, in display order; each has an inventory row.
    sizes: jsonb().$type<string[]>().notNull().default([]),
    // Up to 5 photo URLs (Vercel Blob); the first is the cover.
    images: jsonb().$type<string[]>().notNull().default([]),
    soldOut: boolean().notNull().default(false),
    position: integer().notNull().default(0),
  },
  (t) => [unique().on(t.productId, t.key)],
);

// Pieces on hand for one colour in one size (every product has one row per colour × size;
// for pre-orders it's how many are left in the run). Changed only together with an inventory_movements row.
export const inventory = pgTable(
  "inventory",
  {
    id: uuid().primaryKey().defaultRandom(),
    colourwayId: uuid()
      .notNull()
      .references(() => colourways.id, { onDelete: "cascade" }),
    size: text().notNull(),
    quantity: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.colourwayId, t.size), check("inventory_quantity_not_negative", sql`${t.quantity} >= 0`)],
);

// Every inventory change and why. Names are copied so history survives deleted products.
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial().primaryKey(),
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    // The variant (colour) this change was for; history per colour × size filters on this and size.
    colourwayId: uuid().references(() => colourways.id, { onDelete: "set null" }),
    productName: text().notNull(),
    colourName: text().notNull(),
    size: text().notNull(),
    change: integer().notNull(),
    // Quantity after this change.
    quantityAfter: integer().notNull(),
    reason: inventoryReason().notNull(),
    orderRef: text(),
    note: text().notNull().default(""),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.productId, t.createdAt), index().on(t.colourwayId, t.size, t.createdAt), index().on(t.createdAt)],
);

export type OrderItem = {
  slug: string;
  name: string;
  colourKey: string;
  colour: string;
  size: string;
  qty: number;
  unitPesewas: number;
  preorder: boolean;
  // Set when the order took inventory, so cancelling knows what to give back.
  inventoryTaken?: boolean;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    ref: text().notNull().unique(),
    status: orderStatus().notNull().default("new"),
    customerName: text().notNull(),
    phone: text().notNull(),
    zoneId: text().notNull(),
    zoneLabel: text().notNull(),
    deliveryPesewas: integer().notNull().default(0),
    address: text().notNull().default(""),
    payment: text().notNull(),
    note: text().notNull().default(""),
    items: jsonb().$type<OrderItem[]>().notNull(),
    subtotalPesewas: integer().notNull(),
    totalPesewas: integer().notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.createdAt), index().on(t.status)],
);

// One row (id = 1) holding the editable shop settings as JSON; see lib/settings.ts.
export const settings = pgTable("settings", {
  id: integer().primaryKey().default(1),
  data: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Storefront taps worth counting, e.g. "Notify me" on a coming-soon shirt.
export const events = pgTable(
  "events",
  {
    id: serial().primaryKey(),
    type: text().notNull(),
    productSlug: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.type, t.createdAt)],
);
