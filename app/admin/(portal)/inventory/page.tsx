import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { InventoryFilters } from "@/components/admin/inventory-filters";
import { InventoryProductsTable } from "@/components/admin/inventory-products-table";
import { StartTrackingButton } from "@/components/admin/start-tracking-button";
import { Card, EmptyState } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import {
  findUntracked,
  getInventoryTotals,
  inventorySorts,
  listInventoryProducts,
  stockLevels,
  type InventorySort,
  type StockLevel,
} from "@/lib/admin/inventory-queries";
import { requireAdmin } from "@/lib/admin/session";
import { money } from "@/lib/format";
import { statusLabel } from "@/lib/products";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Inventory" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const sp = await searchParams;
  const level = stockLevels.includes(one(sp.level) as StockLevel) ? (one(sp.level) as StockLevel) : "all";
  const sort = inventorySorts.includes(one(sp.sort) as InventorySort) ? (one(sp.sort) as InventorySort) : "name";
  const status = one(sp.status) === "published" || one(sp.status) === "draft" ? (one(sp.status) as "published" | "draft") : "all";
  const q = one(sp.q) ?? "";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [totals, list, untracked] = await Promise.all([
    getInventoryTotals(),
    listInventoryProducts({ q, level, status, sort, page }),
    findUntracked(q),
  ]);
  const filtered = q !== "" || level !== "all" || status !== "all";

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, level: level === "all" ? "" : level, status: status === "all" ? "" : status, sort: sort === "name" ? "" : sort })) {
      if (v) next.set(k, v);
    }
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  };

  const pills = [
    { label: "Available", value: totals.available, dot: "bg-[#1f7a4d]" },
    { label: "In open orders", value: totals.reserved, dot: "bg-[#d4a72c]" },
    { label: "Delivered", value: totals.sold, dot: "bg-[#2f6fd6]" },
    { label: "Low or out", value: totals.low + totals.out, dot: "bg-[#c8402f]" },
  ];

  const cards = [
    { label: "Total pieces (incl. delivered)", value: (totals.available + totals.reserved + totals.sold).toLocaleString(), tone: "text-ink", icon: "box" },
    { label: "Available", value: totals.available.toLocaleString(), tone: "text-[#1f7a4d]", icon: "check" },
    { label: "In open orders", value: totals.reserved.toLocaleString(), tone: "text-[#b58a1b]", icon: "clock" },
    { label: "Low stock / out of stock", value: `${totals.low} / ${totals.out}`, tone: "text-[#c8402f]", icon: "alert", href: "/admin/inventory?level=low" },
    { label: "Stock value", value: money(totals.valuePesewas / 100), tone: "text-ink", icon: "value" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="font-display text-3xl sm:text-4xl">Inventory</h1>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {pills.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                <span className="font-medium tabular-nums">{p.value.toLocaleString()}</span>
                <span className="text-ink-soft">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/admin/products" className="btn glass px-4! py-2!">
          Manage products
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const body = (
            <>
              <div>
                <p className="text-xs text-ink-soft">{c.label}</p>
                <p className={`mt-1 text-2xl font-medium tabular-nums ${c.tone}`}>{c.value}</p>
              </div>
              <StatIcon name={c.icon} />
            </>
          );
          // The fifth card fills its row on two-column phones and tablets.
          const cls = "glass glass-thick flex items-start justify-between gap-3 rounded-[1.25rem] p-4 last:sm:col-span-2 last:lg:col-span-1";
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cls} transition hover:-translate-y-0.5`}>
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <Card className="p-0! sm:p-0!">
        <div className="space-y-3 border-b border-ink/10 p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">
              Products <span className="text-ink-soft">({list.total})</span>
            </h2>
            {filtered && (
              <Link href="/admin/inventory" className="text-xs text-ink-soft underline">
                Clear filters
              </Link>
            )}
          </div>
          <Suspense>
            <InventoryFilters />
          </Suspense>
        </div>
        {untracked.length > 0 && (
          <div className="border-b border-ink/10 bg-gold/8 px-4 py-3 sm:px-5">
            <p className="mb-2 text-sm">
              {untracked.length === 1 ? "This product matches" : "These products match"} but {untracked.length === 1 ? "doesn't" : "don't"}{" "}
              track inventory yet — customers can always order {untracked.length === 1 ? "it" : "them"}.
            </p>
            <ul className="divide-y divide-ink/8">
              {untracked.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 text-sm hover:underline">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-ink-soft">
                      {" "}
                      · {statusLabel[p.status]}
                      {!p.published && " · Draft"}
                    </span>
                  </Link>
                  <StartTrackingButton productId={p.id} name={p.name} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {totals.variants === 0 ? (
          <EmptyState
            title="No products track inventory yet"
            body="Open a product, switch on “Track inventory” and save. Its colours and sizes appear here, ready to restock."
            href="/admin/products"
            cta="Go to products"
          />
        ) : list.products.length === 0 ? (
          untracked.length > 0 ? null : <EmptyState title="Nothing matches" body="Try another search or clear the filters." />
        ) : (
          <InventoryProductsTable products={list.products} />
        )}
      </Card>
      <Pagination page={list.page} pageCount={list.pageCount} href={pageHref} />
    </>
  );
}

function StatIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    box: <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" />,
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: <path d="M12 3l10 18H2L12 3zM12 10v4M12 17h0" />,
    value: <path d="M4 7h16v10H4zM8 12h0M16 12h0M12 9a3 3 0 100 6 3 3 0 000-6z" />,
  };
  const tone: Record<string, string> = {
    box: "bg-ink/6 text-ink-soft",
    check: "bg-[#1f7a4d]/10 text-[#1f7a4d]",
    clock: "bg-[#d4a72c]/15 text-[#b58a1b]",
    alert: "bg-[#c8402f]/10 text-[#c8402f]",
    value: "bg-gold/15 text-gold-deep",
  };
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone[name]}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths[name]}
      </svg>
    </span>
  );
}
