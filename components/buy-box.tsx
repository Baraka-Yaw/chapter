"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { effectivePrice, statusLabel, type Product } from "@/lib/products";
import { store } from "@/lib/store-config";
import { waLink } from "@/lib/whatsapp";
import { useCart } from "./cart";
import { QtyStepper } from "./cart-drawer";
import { ProductArt } from "./product-art";

export function BuyBox({ product }: { product: Product }) {
  const { add } = useCart();
  const firstInStock = product.colourways.find((c) => !c.soldOut) ?? product.colourways[0];
  const [colourId, setColourId] = useState(firstInStock.id);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const colourway = product.colourways.find((c) => c.id === colourId) ?? firstInStock;
  const comingSoon = product.status === "coming-soon";

  function addToBag() {
    if (!size) {
      setSizeError(true);
      return;
    }
    add({ slug: product.slug, colourwayId: colourway.id, size, qty });
    setQty(1);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="md:sticky md:top-24 md:self-start">
        <ProductArt pattern={product.pattern} colourway={colourway} priority className="rounded-[1.75rem]" />
        {product.colourways.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.colourways.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColourId(c.id)}
                className={`overflow-hidden rounded-xl border-2 ${c.id === colourway.id ? "border-gold" : "border-transparent"}`}
                aria-label={`Show ${c.name}`}
              >
                <ProductArt pattern={product.pattern} colourway={c} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="eyebrow">
          {product.collection} · {statusLabel[product.status]}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>
        <p className="mt-4 text-xl">
          {colourway.salePrice !== undefined && (
            <span className="mr-2 text-ink-soft line-through">{money(colourway.price)}</span>
          )}
          {money(effectivePrice(colourway))}
        </p>
        <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>

        {product.status === "preorder" && (
          <p className="glass mt-5 rounded-2xl px-4 py-3 text-sm">
            Pre-order: made for you and ready in about 2 weeks. We&apos;ll confirm your date on WhatsApp.
          </p>
        )}

        <fieldset className="mt-8">
          <legend className="text-xs tracking-[0.2em] uppercase">
            Colour: <span className="text-ink-soft normal-case tracking-normal">{colourway.name}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colourways.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={c.soldOut}
                onClick={() => setColourId(c.id)}
                aria-pressed={c.id === colourway.id}
                className={`glass flex items-center gap-2 rounded-full px-3.5 py-2 text-sm ${c.id === colourway.id ? "outline-2 outline-ink" : ""} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
              >
                <span className="h-4 w-4 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${c.palette[0]} 50%, ${c.palette[1]} 50%)` }} />
                {c.name}
                {c.id !== firstInStock.id && effectivePrice(c) !== effectivePrice(firstInStock) && (
                  <span className="text-ink-soft">{money(effectivePrice(c))}</span>
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="flex w-full items-center justify-between text-xs tracking-[0.2em] uppercase">
            <span>Size{size && <span className="text-ink-soft normal-case tracking-normal">: {size}</span>}</span>
            <Link href="/size-guide" className="text-ink-soft normal-case tracking-normal underline">Size guide</Link>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                aria-pressed={size === s}
                className={`h-11 min-w-12 rounded-full px-3 text-sm transition ${size === s ? "bg-ink text-cream" : "glass"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {sizeError && <p className="mt-2 text-sm text-[#c8402f]">Please choose a size.</p>}
        </fieldset>

        {comingSoon ? (
          <a
            href={waLink(`Hello ${store.name}! Please let me know when the ${product.name} (${colourway.name}) drops.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark mt-8 w-full"
          >
            Notify me on WhatsApp
          </a>
        ) : (
          <div className="mt-8 flex gap-3">
            <QtyStepper value={qty} onChange={(q) => setQty(Math.max(1, Math.min(20, q)))} />
            <button type="button" onClick={addToBag} className="btn btn-dark flex-1" disabled={colourway.soldOut}>
              {product.status === "preorder" ? "Pre-order — add to bag" : "Add to bag"}
            </button>
          </div>
        )}

        <a
          href={waLink(`Hello ${store.name}! I have a question about the ${product.name} (${colourway.name}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-sm text-ink-soft underline"
        >
          Ask about this on WhatsApp
        </a>

        <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-ink-soft">
          {product.details.map((d) => (
            <li key={d}>— {d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
