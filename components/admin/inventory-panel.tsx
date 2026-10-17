"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateInventory } from "@/lib/admin/actions";
import { LOW_INVENTORY, type Product } from "@/lib/products";
import { formatDate } from "./ui";

export type MovementRow = {
  id: number;
  colourName: string;
  size: string;
  change: number;
  quantityAfter: number;
  reason: "order" | "cancel" | "reopen" | "restock" | "adjust";
  orderRef: string | null;
  note: string;
  createdAt: Date;
};

const reasonLabel: Record<MovementRow["reason"], string> = {
  order: "Order",
  cancel: "Order cancelled",
  reopen: "Order reopened",
  restock: "Received",
  adjust: "Corrected",
};

type Mode = "receive" | "count";

// Inventory per colour × size for one product: view, receive new pieces, or correct counts.
export function InventoryPanel({ product, history }: { product: Product; history: MovementRow[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const qty = (colourKey: string, size: string) => product.colourways.find((c) => c.id === colourKey)?.inventory?.[size] ?? 0;
  const cellKey = (colourKey: string, size: string) => `${colourKey}|${size}`;
  const total = product.colourways.reduce((n, c) => n + product.sizes.reduce((m, s) => m + (c.inventory?.[s] ?? 0), 0), 0);

  function open(next: Mode) {
    setMessage(null);
    setNote("");
    setMode(next);
    // Counting starts from today's numbers; receiving starts empty.
    setValues(
      next === "count"
        ? Object.fromEntries(product.colourways.flatMap((c) => product.sizes.map((s) => [cellKey(c.id, s), String(qty(c.id, s))])))
        : {},
    );
  }

  function save() {
    if (!mode) return;
    const entries = Object.entries(values)
      .filter(([, v]) => v.trim() !== "")
      .map(([k, v]) => {
        const [colourKey, size] = k.split("|");
        return { colourKey, size, quantity: Math.max(0, Math.floor(Number(v) || 0)) };
      });
    startTransition(async () => {
      const result = await updateInventory({ productId: product.id!, mode, note, entries });
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      const n = result.data?.changed ?? 0;
      setMode(null);
      setMessage({
        tone: "ok",
        text: n === 0 ? "Nothing changed." : `Inventory updated for ${n} size${n === 1 ? "" : "s"}. The shop is updated.`,
      });
      router.refresh();
    });
  }

  return (
    <section className="glass glass-thick mt-6 space-y-5 rounded-[1.5rem] p-5 sm:p-6" aria-labelledby="inventory-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="inventory-heading" className="font-display text-xl">
            Inventory
          </h2>
          <p className="text-sm text-ink-soft">
            {total} piece{total === 1 ? "" : "s"} in total
          </p>
        </div>
        {mode === null && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-dark px-4! py-2!" onClick={() => open("receive")}>
              + Receive inventory
            </button>
            <button type="button" className="btn glass px-4! py-2!" onClick={() => open("count")}>
              Correct counts
            </button>
          </div>
        )}
      </div>

      {mode && (
        <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-ink-soft">
          {mode === "receive"
            ? "Enter how many new pieces arrived for each size. Leave the rest empty."
            : "Enter what's actually on the shelf for each size. We'll record the difference."}
        </p>
      )}

      {product.colourways.length === 0 || product.sizes.length === 0 ? (
        <p className="text-sm text-ink-soft">Add colours and sizes to the product, then save, to start counting inventory.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-[0.14em] text-ink-soft uppercase">
                <th className="py-2 pr-3 font-normal">Colour</th>
                {product.sizes.map((s) => (
                  <th key={s} className="px-1 py-2 text-center font-normal">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {product.colourways.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-3">{c.name}</td>
                  {product.sizes.map((s) => {
                    const n = qty(c.id, s);
                    const k = cellKey(c.id, s);
                    return (
                      <td key={s} className="px-1 py-2 text-center">
                        {mode ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            aria-label={`${c.name} ${s}: ${mode === "receive" ? "pieces received" : "pieces on the shelf"}`}
                            placeholder={mode === "receive" ? "+0" : String(n)}
                            value={values[k] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                            className="glass w-16 rounded-lg px-2 py-1.5 text-center"
                          />
                        ) : (
                          <span
                            className={`inline-flex min-w-9 justify-center rounded-full px-2 py-1 ${
                              n === 0 ? "bg-[#c8402f]/12 text-[#c8402f]" : n <= LOW_INVENTORY ? "bg-gold/20 text-gold-deep" : ""
                            }`}
                            title={n === 0 ? "Sold out" : n <= LOW_INVENTORY ? "Running low" : undefined}
                          >
                            {n}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs tracking-[0.16em] uppercase">{mode === "receive" ? "Note (optional)" : "Reason"}</span>
            <input
              className="glass mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm"
              value={note}
              maxLength={200}
              placeholder={mode === "receive" ? "e.g. Batch from tailor, 18 Oct" : "e.g. Stock count, 2 damaged"}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={save} className="btn btn-dark px-5! py-2!">
              {pending ? "Saving…" : mode === "receive" ? "Add to inventory" : "Save counts"}
            </button>
            <button type="button" disabled={pending} onClick={() => setMode(null)} className="btn glass px-5! py-2!">
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm ${message.tone === "error" ? "bg-[#c8402f]/10 text-[#a5321f]" : "bg-[#1f7a4d]/10 text-[#1f7a4d]"}`}
        >
          {message.text}
        </p>
      )}

      <div>
        <h3 className="mb-2 text-xs tracking-[0.16em] text-ink-soft uppercase">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-ink-soft">No changes yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10 text-sm">
            {history.map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-2">
                <span className={`w-12 shrink-0 font-medium ${m.change > 0 ? "text-[#1f7a4d]" : "text-[#c8402f]"}`}>
                  {m.change > 0 ? `+${m.change}` : m.change}
                </span>
                <div className="min-w-0 flex-1">
                  <p>
                    {m.colourName} · {m.size} — {reasonLabel[m.reason]}
                    {m.orderRef && <span className="text-ink-soft"> {m.orderRef}</span>}
                  </p>
                  {m.note && <p className="text-xs text-ink-soft">{m.note}</p>}
                </div>
                <span className="shrink-0 text-right text-xs text-ink-soft">
                  {formatDate(m.createdAt)}
                  <br />
                  {m.quantityAfter} left
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
