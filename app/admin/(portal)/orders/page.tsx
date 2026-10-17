import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, formatDate, PageHeader, StatusPill } from "@/components/admin/ui";
import { orderStatuses, orderStatusLabel, type OrderStatus } from "@/lib/admin/order-status";
import { getOrderCounts, listOrders } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { toCedis } from "@/lib/catalog";
import { money } from "@/lib/format";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const raw = (await searchParams).status;
  const status = orderStatuses.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const [orders, counts] = await Promise.all([listOrders(status), getOrderCounts()]);
  const total = Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Sales" title="Orders" />

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Filter by status">
        <Tab href="/admin/orders" active={!status} label="All" count={total} />
        {orderStatuses.map((s) => (
          <Tab key={s} href={`/admin/orders?status=${s}`} active={status === s} label={orderStatusLabel[s]} count={counts[s] ?? 0} />
        ))}
      </nav>

      <Card className="p-0! sm:p-0!">
        {orders.length === 0 ? (
          <EmptyState
            title={status ? `No ${orderStatusLabel[status].toLowerCase()} orders` : "No orders yet"}
            body="Orders appear here the moment a customer taps “Place order on WhatsApp”."
          />
        ) : (
          <>
          {/* Phones: one card per order. */}
          <ul className="divide-y divide-ink/10 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.ref}`} className="block px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{o.customerName}</span>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-soft">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                  <div className="mt-1 flex justify-between text-xs text-ink-soft">
                    <span>
                      {o.ref} · {formatDate(o.createdAt)}
                    </span>
                    <span className="text-sm text-ink">{money(toCedis(o.totalPesewas))}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs tracking-[0.14em] text-ink-soft uppercase">
                  <th className="px-5 py-3 font-normal">Order</th>
                  <th className="px-3 py-3 font-normal">Customer</th>
                  <th className="px-3 py-3 font-normal">Items</th>
                  <th className="px-3 py-3 text-right font-normal">Total</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orders.map((o) => (
                  <tr key={o.id} className="group">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.ref}`} className="font-medium group-hover:underline">
                        {o.ref}
                      </Link>
                      <p className="text-xs text-ink-soft">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      {o.customerName}
                      <p className="text-xs text-ink-soft">{o.zoneLabel}</p>
                    </td>
                    <td className="max-w-56 px-3 py-3">
                      <p className="truncate">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                    </td>
                    <td className="px-3 py-3 text-right">{money(toCedis(o.totalPesewas))}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
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
