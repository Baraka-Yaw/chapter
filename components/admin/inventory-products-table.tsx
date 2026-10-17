"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { loadProductVariants } from "@/lib/admin/actions";
import type { ProductStockRow, VariantRow } from "@/lib/admin/inventory-queries";
import { money } from "@/lib/format";
import type { Pattern } from "@/lib/products";
import { ProductArt } from "../product-art";
import { Dialog, icons } from "./dialog";
import {
  Actions,
  AdjustDialog,
  HistoryDialog,
  OrdersCell,
  RestockDialog,
  StockCompact,
  VariantCell,
  type Open,
} from "./inventory-table";

// Inventory as one row per product; "View variants" opens every colour × size with its actions.
export function InventoryProductsTable({ products }: { products: ProductStockRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = products.find((p) => p.productId === openId) ?? null;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase">
              <th className="py-3 pr-3 pl-5 font-normal">Product</th>
              <th className="py-3 pr-3 font-normal">Variants</th>
              <th className="py-3 pr-3 font-normal">Stock</th>
              <th className="py-3 pr-3 font-normal">Orders</th>
              <th className="py-3 pr-3 font-normal">Price</th>
              <th className="py-3 pr-5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {products.map((p) => (
              <tr key={p.productId} className="align-middle transition hover:bg-ink/3">
                <td className="py-3 pr-3 pl-5">
                  <ProductCell p={p} />
                </td>
                <td className="py-3 pr-3 text-ink-soft">
                  {p.colours} colour{p.colours === 1 ? "" : "s"} · {p.variants} size{p.variants === 1 ? "" : "s"}
                </td>
                <td className="py-3 pr-3">
                  <StockSummary p={p} />
                </td>
                <td className="py-3 pr-3">
                  <OrdersSummary p={p} />
                </td>
                <td className="py-3 pr-3 tabular-nums">{priceRange(p)}</td>
                <td className="py-3 pr-5 text-right">
                  <ViewButton p={p} onClick={() => setOpenId(p.productId)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink/8 md:hidden">
        {products.map((p) => (
          <li key={p.productId} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <ProductCell p={p} />
              <span className="shrink-0 text-sm tabular-nums">{priceRange(p)}</span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-5">
                <StockSummary p={p} />
                <OrdersSummary p={p} />
              </div>
              <ViewButton p={p} onClick={() => setOpenId(p.productId)} />
            </div>
          </li>
        ))}
      </ul>

      {open && <VariantsDialog product={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function priceRange(p: ProductStockRow) {
  if (p.minPesewas == null || p.maxPesewas == null) return "No price";
  return p.minPesewas === p.maxPesewas ? money(p.minPesewas / 100) : `${money(p.minPesewas / 100)} – ${money(p.maxPesewas / 100)}`;
}

function Thumb({ p }: { p: ProductStockRow }) {
  return (
    <span className="w-11 shrink-0 overflow-hidden rounded-lg">
      <ProductArt
        pattern={p.pattern as Pattern}
        colourway={{ id: p.firstColourKey, name: p.firstColourName, price: 0, palette: p.firstPalette, image: p.firstImage ?? undefined }}
      />
    </span>
  );
}

function ProductCell({ p }: { p: ProductStockRow }) {
  return (
    <Link href={`/admin/products/${p.productId}`} className="group flex items-center gap-3">
      <Thumb p={p} />
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:underline">{p.productName}</span>
        <span className="text-xs text-ink-soft">
          {p.status === "coming-soon" ? "Coming soon" : p.status === "preorder" ? "Pre-order" : "In stock item"}
          {!p.published && <span className="text-gold-deep"> · Draft</span>}
        </span>
      </span>
    </Link>
  );
}

function StockSummary({ p }: { p: ProductStockRow }) {
  const tone = p.available === 0 ? "text-[#c8402f]" : p.low + p.out > 0 ? "text-[#c26a12]" : "text-ink";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="flex items-baseline gap-1.5">
        <span className={`text-xl font-medium tabular-nums ${tone}`}>{p.available}</span>
        <span className="text-xs text-ink-soft">available</span>
      </span>
      {p.out === p.variants ? (
        <span className="rounded-full bg-[#c8402f]/10 px-2 py-0.5 text-[0.68rem] font-medium text-[#c8402f]">Out of stock</span>
      ) : p.low + p.out > 0 ? (
        <span className="rounded-full bg-[#c26a12]/10 px-2 py-0.5 text-[0.68rem] font-medium text-[#c26a12]">
          {[p.low > 0 && `${p.low} low`, p.out > 0 && `${p.out} out`].filter(Boolean).join(" · ")}
        </span>
      ) : (
        <span className="rounded-full bg-[#1f7a4d]/10 px-2 py-0.5 text-[0.68rem] font-medium text-[#1f7a4d]">In stock</span>
      )}
    </div>
  );
}

function OrdersSummary({ p }: { p: ProductStockRow }) {
  if (p.reserved === 0 && p.sold === 0) return <span className="text-xs text-ink-soft">No orders yet</span>;
  return (
    <div className="space-y-0.5 text-xs">
      {p.reserved > 0 && (
        <p className="flex items-center gap-1.5 text-[#b58a1b]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {p.reserved} in open orders
        </p>
      )}
      {p.sold > 0 && (
        <p className="flex items-center gap-1.5 text-[#2f6fd6]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {p.sold} delivered
        </p>
      )}
    </div>
  );
}

function ViewButton({ p, onClick }: { p: ProductStockRow; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View variants of ${p.productName}`}
      className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition hover:-translate-y-px"
    >
      {icons.variants}
      <span>View variants</span>
    </button>
  );
}

// ---------- Variants dialog ----------

// One dialog for the product: the variant list, and Restock / Adjust / History in place of it.
function VariantsDialog({ product, onClose }: { product: ProductStockRow; onClose: () => void }) {
  const [variants, setVariants] = useState<VariantRow[] | null>(null);
  const [view, setView] = useState<Open>(null);

  const reload = useCallback(() => {
    loadProductVariants(product.productId).then(setVariants, () => setVariants([]));
  }, [product.productId]);

  useEffect(reload, [reload]);

  const back = () => setView(null);

  if (view?.kind === "restock") return <RestockDialog v={view.v} onClose={back} onSaved={reload} backLabel="Back" />;
  if (view?.kind === "adjust") return <AdjustDialog v={view.v} onClose={back} onSaved={reload} backLabel="Back" />;
  if (view?.kind === "history") return <HistoryDialog v={view.v} onClose={back} />;

  const total = variants?.reduce((n, v) => n + v.quantity, 0) ?? product.available;

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={icons.variants}
      title={product.productName}
      subtitle={`${product.colours} colour${product.colours === 1 ? "" : "s"} · ${product.variants} size${product.variants === 1 ? "" : "s"} · ${total} available`}
      footer={
        <>
          <Link href={`/admin/products/${product.productId}`} className="btn glass mr-auto px-5! py-2!">
            Edit product
          </Link>
          <button type="button" onClick={onClose} className="btn btn-dark px-5! py-2!">
            Done
          </button>
        </>
      }
    >
      {variants === null ? (
        <p className="py-10 text-center text-sm text-ink-soft">Loading variants…</p>
      ) : variants.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">This product has no colours or sizes yet.</p>
      ) : (
        <div className="-mx-5 sm:-mx-6">
          {groupByColour(variants).map((group) => (
            <section key={group[0].colourKey}>
              <h3 className="flex items-center justify-between bg-ink/4 px-5 py-2 text-xs tracking-[0.12em] text-ink-soft uppercase sm:px-6">
                <span>{group[0].colourName}</span>
                <span className="tabular-nums normal-case tracking-normal">
                  {group.reduce((n, v) => n + v.quantity, 0)} available
                </span>
              </h3>
              <ul className="divide-y divide-ink/6">
                {group.map((v) => (
                  <li key={v.inventoryId} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="min-w-0 flex-1 space-y-1">
                      <VariantCell v={v} />
                      <OrdersCell v={v} />
                    </div>
                    <StockCompact v={v} />
                    <Actions v={v} onOpen={setView} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Dialog>
  );
}

function groupByColour(variants: VariantRow[]) {
  const groups: VariantRow[][] = [];
  for (const v of variants) {
    const last = groups.at(-1);
    if (last && last[0].colourKey === v.colourKey) last.push(v);
    else groups.push([v]);
  }
  return groups;
}
