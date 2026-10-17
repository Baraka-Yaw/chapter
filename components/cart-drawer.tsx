"use client";

import Link from "next/link";
import { useEffect } from "react";
import { money } from "@/lib/format";
import { useCart } from "./cart";
import { ProductArt } from "./product-art";

export function CartDrawer() {
  const { lines, subtotal, open, setOpen, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-night/30 backdrop-blur-[3px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Your bag"
        className={`glass glass-thick absolute inset-y-2 right-2 flex w-[calc(100%-1rem)] max-w-sm flex-col overflow-hidden rounded-3xl transition-transform duration-500 ease-[cubic-bezier(0.2,0.9,0.25,1.15)] ${open ? "translate-x-0" : "translate-x-[110%]"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg tracking-[0.12em]">Your Bag</h2>
          <button type="button" onClick={() => setOpen(false)} className="glass h-10 w-10 rounded-full text-2xl leading-none" aria-label="Close bag">
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-ink-soft">Your bag is empty.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-dark">
              Shop now
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="w-20 shrink-0 overflow-hidden rounded-xl">
                    <ProductArt pattern={l.product.pattern} colourway={l.colourway} />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 text-sm">
                    <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="font-medium leading-snug">
                      {l.product.name}
                    </Link>
                    <span className="text-ink-soft">
                      {l.colourway.name} · {l.size}
                      {l.product.status === "preorder" && " · Pre-order"}
                    </span>
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={l.qty} onChange={(q) => setQty(l.key, q)} />
                      <span>{money(l.unitPrice * l.qty)}</span>
                    </div>
                    <button type="button" onClick={() => remove(l.key)} className="self-start text-xs text-ink-soft underline">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-ink/10 px-5 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{money(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-soft">Delivery is added at checkout. You&apos;ll confirm and pay on WhatsApp.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-dark w-full">
                Checkout
              </Link>
              <button type="button" onClick={() => setOpen(false)} className="btn glass w-full">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function QtyStepper({ value, onChange, max = 20 }: { value: number; onChange: (qty: number) => void; max?: number }) {
  return (
    <div className="glass flex items-center rounded-full">
      <button type="button" className="h-8 w-8" onClick={() => onChange(value - 1)} aria-label="Decrease quantity" disabled={value <= 1}>
        −
      </button>
      <span className="w-7 text-center text-sm" aria-live="polite">{value}</span>
      <button type="button" className="h-8 w-8" onClick={() => onChange(value + 1)} aria-label="Increase quantity" disabled={value >= max}>
        +
      </button>
    </div>
  );
}
