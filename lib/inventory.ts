import "server-only";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { OrderItem } from "./db/schema";

// Inventory is changed only through applyMovement, so every quantity change has a matching
// inventory_movements row. Callers pass their transaction so orders and inventory commit together.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Reason = (typeof schema.inventoryReason.enumValues)[number];

export class InventoryShortage extends Error {
  constructor(
    message: string,
    readonly available: number,
  ) {
    super(message);
  }
}

type Variant = { colourwayId: string; size: string };

async function describe(tx: Tx, colourwayId: string) {
  const [row] = await tx
    .select({ productId: schema.products.id, productName: schema.products.name, colourName: schema.colourways.name })
    .from(schema.colourways)
    .innerJoin(schema.products, eq(schema.products.id, schema.colourways.productId))
    .where(eq(schema.colourways.id, colourwayId));
  return row;
}

// Adds `change` (negative to take away). Throws InventoryShortage instead of going below zero.
export async function applyMovement(
  tx: Tx,
  v: Variant & { change: number; reason: Reason; orderRef?: string; note?: string },
) {
  const [updated] = await tx
    .update(schema.inventory)
    .set({ quantity: sql`${schema.inventory.quantity} + ${v.change}` })
    .where(
      and(
        eq(schema.inventory.colourwayId, v.colourwayId),
        eq(schema.inventory.size, v.size),
        sql`${schema.inventory.quantity} + ${v.change} >= 0`,
      ),
    )
    .returning({ quantity: schema.inventory.quantity });

  let quantityAfter = updated?.quantity;
  if (quantityAfter === undefined) {
    const [existing] = await tx
      .select({ quantity: schema.inventory.quantity })
      .from(schema.inventory)
      .where(and(eq(schema.inventory.colourwayId, v.colourwayId), eq(schema.inventory.size, v.size)));
    if (existing || v.change < 0) {
      const info = await describe(tx, v.colourwayId);
      const available = existing?.quantity ?? 0;
      throw new InventoryShortage(
        available === 0
          ? `${info?.productName ?? "This item"} in ${info?.colourName ?? "this colour"}, size ${v.size} is sold out.`
          : `Only ${available} left of ${info?.productName ?? "this item"} in ${info?.colourName ?? "this colour"}, size ${v.size}.`,
        available,
      );
    }
    // First stock for a size that had no row yet.
    const [created] = await tx
      .insert(schema.inventory)
      .values({ colourwayId: v.colourwayId, size: v.size, quantity: v.change })
      .returning({ quantity: schema.inventory.quantity });
    quantityAfter = created.quantity;
  }

  const info = await describe(tx, v.colourwayId);
  await tx.insert(schema.inventoryMovements).values({
    productId: info?.productId ?? null,
    colourwayId: v.colourwayId,
    productName: info?.productName ?? "Deleted product",
    colourName: info?.colourName ?? "",
    size: v.size,
    change: v.change,
    quantityAfter,
    reason: v.reason,
    orderRef: v.orderRef ?? null,
    note: v.note ?? "",
  });
  return quantityAfter;
}

// Keeps one inventory row per colour × size of a tracked product; rows for removed sizes go.
// (Rows for removed colours are deleted with the colour.)
export async function syncInventoryRows(tx: Tx, productId: string, sizes: string[]) {
  const cws = await tx
    .select({ id: schema.colourways.id })
    .from(schema.colourways)
    .where(eq(schema.colourways.productId, productId));
  if (cws.length === 0) return;
  const ids = cws.map((c) => c.id);
  if (sizes.length > 0) {
    await tx
      .delete(schema.inventory)
      .where(and(inArray(schema.inventory.colourwayId, ids), notInArray(schema.inventory.size, sizes)));
    await tx
      .insert(schema.inventory)
      .values(ids.flatMap((colourwayId) => sizes.map((size) => ({ colourwayId, size, quantity: 0 }))))
      .onConflictDoNothing();
  } else {
    await tx.delete(schema.inventory).where(inArray(schema.inventory.colourwayId, ids));
  }
}

async function colourwayId(tx: Tx, productSlug: string, colourKey: string) {
  const [row] = await tx
    .select({ id: schema.colourways.id })
    .from(schema.colourways)
    .innerJoin(schema.products, eq(schema.products.id, schema.colourways.productId))
    .where(and(eq(schema.products.slug, productSlug), eq(schema.colourways.key, colourKey)));
  return row?.id;
}

// Takes inventory for the tracked items of a new order. Returns the items marked with what was taken.
export async function takeForOrder(tx: Tx, ref: string, items: OrderItem[], tracked: Set<string>) {
  const out: OrderItem[] = [];
  for (const item of items) {
    if (!tracked.has(item.slug)) {
      out.push(item);
      continue;
    }
    const id = await colourwayId(tx, item.slug, item.colourKey);
    if (!id) throw new InventoryShortage(`${item.name} is no longer available.`, 0);
    await applyMovement(tx, { colourwayId: id, size: item.size, change: -item.qty, reason: "order", orderRef: ref });
    out.push({ ...item, inventoryTaken: true });
  }
  return out;
}

// Gives back (cancel) or takes again (reopen) what an order took. Colours deleted since are skipped.
export async function moveOrderInventory(tx: Tx, ref: string, items: OrderItem[], direction: "cancel" | "reopen") {
  let moved = false;
  for (const item of items) {
    if (!item.inventoryTaken) continue;
    const id = await colourwayId(tx, item.slug, item.colourKey);
    if (!id) continue;
    await applyMovement(tx, {
      colourwayId: id,
      size: item.size,
      change: direction === "cancel" ? item.qty : -item.qty,
      reason: direction,
      orderRef: ref,
    });
    moved = true;
  }
  return moved;
}
