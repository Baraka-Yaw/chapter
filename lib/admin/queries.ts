import "server-only";
import { and, count, desc, eq, gte, inArray, ne, sql, sum } from "drizzle-orm";
import { db, schema } from "../db";
import type { OrderStatus } from "./order-status";

// Money has come in once an order is paid or later.
const PAID: OrderStatus[] = ["paid", "made", "delivered"];
const AWAITING_PAYMENT: OrderStatus[] = ["new", "confirmed"];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboard() {
  const o = schema.orders;
  const [[week], [month], [awaiting], [taps], recent, best] = await Promise.all([
    db.select({ n: count() }).from(o).where(and(gte(o.createdAt, daysAgo(7)), ne(o.status, "cancelled"))),
    db
      .select({ total: sum(o.totalPesewas).mapWith(Number), n: count() })
      .from(o)
      .where(and(gte(o.createdAt, startOfMonth()), inArray(o.status, PAID))),
    db
      .select({ total: sum(o.totalPesewas).mapWith(Number), n: count() })
      .from(o)
      .where(inArray(o.status, AWAITING_PAYMENT)),
    db
      .select({ n: count() })
      .from(schema.events)
      .where(and(eq(schema.events.type, "notify"), gte(schema.events.createdAt, daysAgo(7)))),
    db.select().from(o).orderBy(desc(o.createdAt)).limit(6),
    // Units sold per shirt over the last 30 days, from the items stored on each order.
    db.execute<{ name: string; qty: number; revenue: number }>(sql`
      select item->>'name' as name,
             sum((item->>'qty')::int)::int as qty,
             sum((item->>'qty')::int * (item->>'unitPesewas')::int)::int as revenue
      from ${o}, jsonb_array_elements(${o.items}) as item
      where ${o.createdAt} >= ${daysAgo(30).toISOString()}::timestamptz and ${o.status} <> 'cancelled'
      group by 1
      order by qty desc
      limit 5
    `),
  ]);

  return {
    ordersThisWeek: week?.n ?? 0,
    paidThisMonth: { pesewas: month?.total ?? 0, count: month?.n ?? 0 },
    awaitingPayment: { pesewas: awaiting?.total ?? 0, count: awaiting?.n ?? 0 },
    notifyTaps: taps?.n ?? 0,
    recent,
    bestSellers: [...best],
  };
}

export async function getOrderCounts() {
  const rows = await db.select({ status: schema.orders.status, n: count() }).from(schema.orders).groupBy(schema.orders.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
}

export async function listOrders(status?: OrderStatus) {
  const o = schema.orders;
  return db
    .select()
    .from(o)
    .where(status ? eq(o.status, status) : undefined)
    .orderBy(desc(o.createdAt))
    .limit(200);
}

export async function getOrder(ref: string) {
  const [row] = await db.select().from(schema.orders).where(eq(schema.orders.ref, ref)).limit(1);
  return row;
}
