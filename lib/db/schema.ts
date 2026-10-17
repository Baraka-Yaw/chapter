import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Money columns are whole pesewas (GH₵1 = 100) so sums never drift.

export const productStatus = pgEnum("product_status", ["available", "preorder", "coming-soon"]);
export const orderStatus = pgEnum("order_status", ["new", "confirmed", "paid", "made", "delivered", "cancelled"]);

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
  sizes: jsonb().$type<string[]>().notNull().default([]),
  featured: boolean().notNull().default(false),
  hidden: boolean().notNull().default(false),
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
    pricePesewas: integer().notNull(),
    salePesewas: integer(),
    palette: jsonb().$type<[string, string, string]>().notNull(),
    image: text(),
    soldOut: boolean().notNull().default(false),
    position: integer().notNull().default(0),
  },
  (t) => [unique().on(t.productId, t.key)],
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
