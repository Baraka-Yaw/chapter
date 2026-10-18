"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { adjustVariant, loadVariantMovements, restockVariant } from "@/lib/admin/actions";
import type { VariantRow } from "@/lib/admin/inventory-queries";
import { money } from "@/lib/format";
import { LOW_INVENTORY, type Pattern } from "@/lib/products";
import { ProductArt } from "../product-art";
import { Dialog, icons } from "./dialog";
import { formatDate } from "./ui";

type Movement = Awaited<ReturnType<typeof loadVariantMovements>>[number];
export type Open = { kind: "restock" | "adjust" | "history"; v: VariantRow } | null;

const reasonLabel: Record<Movement["reason"], string> = {
  order: "Order placed",
  cancel: "Order cancelled",
  reopen: "Order reopened",
  restock: "Restocked",
  adjust: "Adjusted",
};

// One row per variant (colour × size) with Restock / Adjust / History actions.
export function InventoryTable({ variants, showProduct = true }: { variants: VariantRow[]; showProduct?: boolean }) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);

  return (
    <>
      {/* Wide screens: a table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase">
              {showProduct && <th className="py-3 pr-3 pl-5 font-normal">Product</th>}
              <th className={`py-3 pr-3 font-normal ${showProduct ? "" : "pl-5"}`}>Variant</th>
              <th className="py-3 pr-3 font-normal">Stock</th>
              <th className="py-3 pr-3 font-normal">Orders</th>
              <th className="py-3 pr-3 font-normal">Price</th>
              <th className="py-3 pr-5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {variants.map((v) => (
              <tr key={v.inventoryId} className="align-middle transition hover:bg-ink/3">
                {showProduct && (
                  <td className="py-3 pr-3 pl-5">
                    <ProductCell v={v} />
                  </td>
                )}
                <td className={`py-3 pr-3 ${showProduct ? "" : "pl-5"}`}>
                  <VariantCell v={v} />
                </td>
                <td className="py-3 pr-3">
                  <StockCell v={v} />
                </td>
                <td className="py-3 pr-3">
                  <OrdersCell v={v} />
                </td>
                <td className="py-3 pr-3">
                  <PriceCell v={v} />
                </td>
                <td className="py-3 pr-5">
                  <Actions v={v} onOpen={setOpen} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: sizes grouped under their product, one compact line each. */}
      <div className="md:hidden">
        {groupByProduct(variants).map((group) => (
          <section key={group[0].productId + group[0].inventoryId} className="border-b border-ink/8 last:border-b-0">
            {showProduct && (
              <div className="flex items-center justify-between gap-3 bg-ink/3 px-4 py-2.5">
                <ProductCell v={group[0]} />
                <PriceCell v={group[0]} />
              </div>
            )}
            <ul className="divide-y divide-ink/6">
              {group.map((v) => (
                <li key={v.inventoryId} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <VariantCell v={v} />
                    <OrdersCell v={v} />
                  </div>
                  <StockCompact v={v} />
                  <Actions v={v} onOpen={setOpen} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {open?.kind === "restock" && <RestockDialog v={open.v} onClose={close} />}
      {open?.kind === "adjust" && <AdjustDialog v={open.v} onClose={close} />}
      {open?.kind === "history" && <HistoryDialog v={open.v} onClose={close} />}
    </>
  );
}

// Consecutive rows of the same product, so phones show the product once.
function groupByProduct(variants: VariantRow[]) {
  const groups: VariantRow[][] = [];
  for (const v of variants) {
    const last = groups.at(-1);
    if (last && last[0].productId === v.productId) last.push(v);
    else groups.push([v]);
  }
  return groups;
}

// ---------- Cells ----------

export function Swatch({ palette }: { palette: [string, string, string] }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-ink/15"
      style={{ background: `linear-gradient(135deg, ${palette[0]} 50%, ${palette[1]} 50%)` }}
      aria-hidden="true"
    />
  );
}

function ProductCell({ v }: { v: VariantRow }) {
  return (
    <Link href={`/admin/products/${v.productId}`} className="group flex items-center gap-3">
      <span className="w-11 shrink-0 overflow-hidden rounded-lg">
        <ProductArt
          pattern={v.pattern as Pattern}
          colourway={{ id: v.colourKey, name: v.colourName, price: 0, palette: v.palette, sizes: [], images: v.image ? [v.image] : undefined }}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:underline">{v.productName}</span>
        {!v.published && <span className="text-xs text-gold-deep">Draft</span>}
      </span>
    </Link>
  );
}

export function VariantCell({ v }: { v: VariantRow }) {
  return (
    <span className="flex items-center gap-2">
      <Swatch palette={v.palette} />
      <span>
        {v.colourName} <span className="text-ink-soft">•</span> {v.size}
      </span>
    </span>
  );
}

export function stockState(n: number) {
  if (n === 0) return { label: "Out of stock", number: "text-[#c8402f]", badge: "bg-[#c8402f]/10 text-[#c8402f]" };
  if (n <= LOW_INVENTORY) return { label: "Low stock", number: "text-[#c26a12]", badge: "bg-[#c26a12]/10 text-[#c26a12]" };
  return { label: "In stock", number: "text-ink", badge: "bg-[#1f7a4d]/10 text-[#1f7a4d]" };
}

function StockCell({ v }: { v: VariantRow }) {
  const s = stockState(v.quantity);
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="flex items-baseline gap-1.5">
        <span className={`text-xl font-medium tabular-nums ${s.number}`}>{v.quantity}</span>
        <span className="text-xs text-ink-soft">available</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${s.badge}`}>{s.label}</span>
    </div>
  );
}

export function StockCompact({ v }: { v: VariantRow }) {
  const s = stockState(v.quantity);
  return (
    <div className="w-16 text-right">
      <p className={`text-lg leading-none font-medium tabular-nums ${s.number}`}>{v.quantity}</p>
      <p className={`mt-1 text-[0.65rem] ${v.quantity <= LOW_INVENTORY ? s.number : "text-ink-soft"}`}>
        {v.quantity === 0 ? "Out" : v.quantity <= LOW_INVENTORY ? "Low" : "in stock"}
      </p>
    </div>
  );
}

export function OrdersCell({ v }: { v: VariantRow }) {
  if (v.reserved === 0 && v.sold === 0) return <span className="text-xs text-ink-soft">No orders yet</span>;
  return (
    <div className="space-y-0.5 text-xs">
      {v.reserved > 0 && (
        <p className="flex items-center gap-1.5 text-[#b58a1b]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {v.reserved} in open orders
        </p>
      )}
      {v.sold > 0 && (
        <p className="flex items-center gap-1.5 text-[#2f6fd6]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {v.sold} delivered
        </p>
      )}
    </div>
  );
}

function PriceCell({ v }: { v: VariantRow }) {
  if (v.pricePesewas == null) return <span className="text-xs text-ink-soft">No price</span>;
  return (
    <div className="text-right md:text-left">
      <p className="tabular-nums">{money((v.salePesewas ?? v.pricePesewas) / 100)}</p>
      {v.salePesewas != null && <p className="text-xs text-ink-soft tabular-nums line-through">{money(v.pricePesewas / 100)}</p>}
    </div>
  );
}

export function Actions({ v, onOpen }: { v: VariantRow; onOpen: (o: Open) => void }) {
  const button = "flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/8 hover:text-ink";
  return (
    <div className="flex justify-end gap-1">
      <button type="button" title="Restock" aria-label={`Restock ${v.colourName} ${v.size}`} className={button} onClick={() => onOpen({ kind: "restock", v })}>
        {icons.restock}
      </button>
      <button type="button" title="Adjust stock" aria-label={`Adjust ${v.colourName} ${v.size}`} className={button} onClick={() => onOpen({ kind: "adjust", v })}>
        {icons.adjust}
      </button>
      <button type="button" title="Stock history" aria-label={`History for ${v.colourName} ${v.size}`} className={button} onClick={() => onOpen({ kind: "history", v })}>
        {icons.history}
      </button>
    </div>
  );
}

// ---------- Dialogs ----------

function VariantSummary({ v }: { v: VariantRow }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink/4 p-3">
      <span className="w-12 shrink-0 overflow-hidden rounded-lg">
        <ProductArt
          pattern={v.pattern as Pattern}
          colourway={{ id: v.colourKey, name: v.colourName, price: 0, palette: v.palette, sizes: [], images: v.image ? [v.image] : undefined }}
        />
      </span>
      <div className="text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Swatch palette={v.palette} /> {v.colourName} • {v.size}
        </p>
        <p className="text-ink-soft">
          In stock: <span className="text-ink tabular-nums">{v.quantity}</span>
          {v.reserved > 0 && <> · {v.reserved} in open orders</>}
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">
        {label}
        {required && <span className="text-[#c8402f]"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const input = "glass w-full rounded-xl px-4 py-2.5 text-sm";

function Summary({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="space-y-1.5 rounded-2xl bg-ink/4 p-4 text-sm">
      {rows.map(([k, val], i) => (
        <div key={k} className={`flex justify-between ${i === rows.length - 1 ? "border-t border-ink/10 pt-1.5 font-medium" : ""}`}>
          <dt className="text-ink-soft">{k}</dt>
          <dd className="tabular-nums">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

// After a save: refresh the page (and any caller-held list via onSaved), then close.
function useSave(onClose: () => void, onSaved?: () => void) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) return setError(result.error ?? "Something went wrong.");
      onSaved?.();
      onClose();
      router.refresh();
    });
  return { error, pending, run };
}

export function RestockDialog({ v, onClose, onSaved, backLabel }: { v: VariantRow; onClose: () => void; onSaved?: () => void; backLabel?: string }) {
  const [qty, setQty] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const { error, pending, run } = useSave(onClose, onSaved);
  const adding = Math.max(0, Math.floor(Number(qty) || 0));

  return (
    <Dialog
      open
      onClose={onClose}
      tone="green"
      icon={icons.restock}
      title="Restock"
      subtitle={v.productName}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn glass px-5! py-2!">
            {backLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            disabled={pending || adding === 0}
            onClick={() => run(() => restockVariant({ inventoryId: v.inventoryId, quantity: adding, reference, note }))}
            className="btn btn-dark px-5! py-2!"
          >
            {pending ? "Saving…" : "Restock"}
          </button>
        </>
      }
    >
      <VariantSummary v={v} />
      <Field label="Quantity to add" required>
        <input className={input} type="number" min="1" step="1" inputMode="numeric" placeholder="Enter quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Reference" hint="Optional — e.g. the tailor's batch or invoice number">
        <input className={input} maxLength={60} value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
      <Field label="Notes">
        <input className={input} maxLength={200} placeholder="e.g. Batch from tailor" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Summary rows={[["Current stock", v.quantity], ["Adding", `+${adding}`], ["New total", v.quantity + adding]]} />
      {error && <p role="alert" className="text-sm text-[#c8402f]">{error}</p>}
    </Dialog>
  );
}

export function AdjustDialog({ v, onClose, onSaved, backLabel }: { v: VariantRow; onClose: () => void; onSaved?: () => void; backLabel?: string }) {
  const [type, setType] = useState<"increase" | "decrease" | "set">("decrease");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const { error, pending, run } = useSave(onClose, onSaved);
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const next = type === "increase" ? v.quantity + n : type === "decrease" ? v.quantity - n : n;
  const types = [
    { id: "increase", label: "Increase", hint: "Add pieces" },
    { id: "decrease", label: "Decrease", hint: "Remove pieces" },
    { id: "set", label: "Set to", hint: "After a count" },
  ] as const;

  return (
    <Dialog
      open
      onClose={onClose}
      tone="gold"
      icon={icons.adjust}
      title="Adjust stock"
      subtitle={v.productName}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn glass px-5! py-2!">
            {backLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            disabled={pending || qty.trim() === "" || next < 0}
            onClick={() => run(() => adjustVariant({ inventoryId: v.inventoryId, type, quantity: n, note }))}
            className="btn btn-dark px-5! py-2!"
          >
            {pending ? "Saving…" : "Adjust stock"}
          </button>
        </>
      }
    >
      <VariantSummary v={v} />
      <fieldset>
        <legend className="text-sm font-medium">
          Adjustment type<span className="text-[#c8402f]"> *</span>
        </legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={type === t.id}
              onClick={() => setType(t.id)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${type === t.id ? "bg-ink text-cream" : "glass"}`}
            >
              <span className="block font-medium">{t.label}</span>
              <span className={`block text-xs ${type === t.id ? "text-cream/70" : "text-ink-soft"}`}>{t.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={type === "set" ? "Pieces on the shelf" : "Quantity"} required>
        <input className={input} type="number" min="0" step="1" inputMode="numeric" placeholder="Enter quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
      </Field>
      <Field label="Notes" required hint="Say why, so the history makes sense later">
        <input className={input} maxLength={200} placeholder="e.g. 2 damaged, gift, stock count" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Summary rows={[["Current stock", v.quantity], ["Change", next - v.quantity >= 0 ? `+${next - v.quantity}` : next - v.quantity], ["New total", next < 0 ? "—" : next]]} />
      {next < 0 && <p className="text-sm text-[#c8402f]">You can&apos;t remove more than the {v.quantity} in stock.</p>}
      {error && <p role="alert" className="text-sm text-[#c8402f]">{error}</p>}
    </Dialog>
  );
}

export function HistoryDialog({ v, onClose }: { v: VariantRow; onClose: () => void }) {
  const [rows, setRows] = useState<Movement[] | null>(null);

  useEffect(() => {
    loadVariantMovements(v.inventoryId).then(setRows, () => setRows([]));
  }, [v.inventoryId]);

  return (
    <Dialog open onClose={onClose} icon={icons.history} title="Stock history" subtitle={`${v.productName} — ${v.colourName} • ${v.size}`}>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-ink/4 p-4 text-center">
        <Stat value={v.quantity} label="In stock" tone="text-ink" />
        <Stat value={v.reserved} label="In open orders" tone="text-[#b58a1b]" />
        <Stat value={v.sold} label="Delivered" tone="text-[#2f6fd6]" />
      </div>
      {rows === null ? (
        <p className="py-8 text-center text-sm text-ink-soft">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center text-ink-soft">{icons.history}</span>
          <p className="font-medium">No movements yet</p>
          <p className="text-sm text-ink-soft">Restocks, orders and adjustments for this size will show here.</p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-ink/10 pl-5">
          {rows.map((m) => (
            <li key={m.id} className="relative">
              <span className={`absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-full ring-4 ring-cream ${m.change > 0 ? "bg-[#1f7a4d]" : "bg-[#c8402f]"}`} />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">
                  {reasonLabel[m.reason]}
                  {m.orderRef && <span className="ml-1 font-normal text-ink-soft">{m.orderRef}</span>}
                </p>
                <span className={`text-sm font-medium tabular-nums ${m.change > 0 ? "text-[#1f7a4d]" : "text-[#c8402f]"}`}>
                  {m.change > 0 ? `+${m.change}` : m.change}
                </span>
              </div>
              {m.note && <p className="text-sm text-ink-soft">{m.note}</p>}
              <p className="text-xs text-ink-soft">
                {formatDate(new Date(m.createdAt))} · {m.quantityAfter} left
              </p>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`text-2xl font-medium tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
