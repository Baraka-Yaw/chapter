import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, formatDate, PageHeader } from "@/components/admin/ui";
import { ProductArt } from "@/components/product-art";
import { getInventoryHistory } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { loadAllProducts } from "@/lib/catalog";
import { LOW_INVENTORY, type Product } from "@/lib/products";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Inventory" };

const reasonLabel = { order: "Order", cancel: "Order cancelled", reopen: "Order reopened", restock: "Received", adjust: "Corrected" } as const;

function lowSizes(p: Product) {
  return p.colourways.flatMap((c) =>
    p.sizes.flatMap((s) => {
      const n = c.inventory?.[s] ?? 0;
      return n <= LOW_INVENTORY ? [{ colour: c.name, size: s, n }] : [];
    }),
  );
}

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const lowOnly = (await searchParams).show === "low";
  const [all, history] = await Promise.all([loadAllProducts(), getInventoryHistory(undefined, 25)]);
  const tracked = all.filter((p) => p.trackInventory);
  const lowCount = tracked.reduce((n, p) => n + lowSizes(p).length, 0);
  const shown = lowOnly ? tracked.filter((p) => lowSizes(p).length > 0) : tracked;

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Inventory" />

      <nav className="mb-6 flex gap-2" aria-label="Filter inventory">
        <Tab href="/admin/inventory" active={!lowOnly} label="All tracked" count={tracked.length} />
        <Tab href="/admin/inventory?show=low" active={lowOnly} label="Running low" count={lowCount} />
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-0! sm:p-0!">
          {tracked.length === 0 ? (
            <EmptyState
              title="No products track inventory yet"
              body="Open a product, switch on “Track inventory”, save, then add pieces with “Receive inventory”."
              href="/admin/products"
              cta="Go to products"
            />
          ) : shown.length === 0 ? (
            <EmptyState title="Nothing running low" body={`Every tracked size has more than ${LOW_INVENTORY} pieces.`} />
          ) : (
            <ul className="divide-y divide-ink/10">
              {shown.map((p) => {
                const total = p.colourways.reduce((n, c) => n + p.sizes.reduce((m, s) => m + (c.inventory?.[s] ?? 0), 0), 0);
                const low = lowSizes(p);
                return (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-start gap-4 px-4 py-4 hover:bg-ink/4 sm:px-5">
                      <div className="w-12 shrink-0 overflow-hidden rounded-lg">
                        {p.colourways[0] ? <ProductArt pattern={p.pattern} colourway={p.colourways[0]} /> : <div className="aspect-[5/6] bg-cream-deep" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">
                            {p.name}
                            {p.draft && <span className="ml-2 text-xs text-ink-soft">(draft)</span>}
                          </span>
                          <span className="text-sm text-ink-soft">
                            {total} piece{total === 1 ? "" : "s"}
                          </span>
                        </div>
                        {low.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {low.map((l) => (
                              <span
                                key={`${l.colour}-${l.size}`}
                                className={`rounded-full px-2 py-0.5 text-xs ${l.n === 0 ? "bg-[#c8402f]/12 text-[#c8402f]" : "bg-gold/20 text-gold-deep"}`}
                              >
                                {l.colour} · {l.size}: {l.n === 0 ? "sold out" : `${l.n} left`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-ink-soft">All sizes in stock</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="h-fit">
          <h2 className="mb-3 font-display text-xl">Recent changes</h2>
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">No inventory changes yet.</p>
          ) : (
            <ul className="divide-y divide-ink/10 text-sm">
              {history.map((m) => (
                <li key={m.id} className="flex gap-3 py-2">
                  <span className={`w-10 shrink-0 font-medium ${m.change > 0 ? "text-[#1f7a4d]" : "text-[#c8402f]"}`}>
                    {m.change > 0 ? `+${m.change}` : m.change}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{m.productName}</p>
                    <p className="text-xs text-ink-soft">
                      {m.colourName} · {m.size} · {reasonLabel[m.reason]}
                      {m.orderRef ? ` ${m.orderRef}` : ""} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Tab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${active ? "bg-ink text-cream" : "glass"}`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-xs ${active ? "bg-cream/20" : "bg-ink/8"}`}>{count}</span>
    </Link>
  );
}
