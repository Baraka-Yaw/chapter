import Link from "next/link";
import { Card, EmptyState, formatDate, PageHeader, StatusPill } from "@/components/admin/ui";
import { getDashboard, getLowInventory } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { toCedis } from "@/lib/catalog";
import { money } from "@/lib/format";
import { LOW_INVENTORY } from "@/lib/products";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export default async function DashboardPage() {
  await requireAdmin();
  const [d, low] = await Promise.all([getDashboard(), getLowInventory(LOW_INVENTORY)]);
  const soldOut = low.filter((l) => l.quantity === 0).length;

  const stats = [
    { label: "Orders this week", value: String(d.ordersThisWeek), hint: "Not counting cancelled", href: "/admin/orders" },
    {
      label: "Awaiting payment",
      value: money(toCedis(d.awaitingPayment.pesewas)),
      hint: `${d.awaitingPayment.count} order${d.awaitingPayment.count === 1 ? "" : "s"} new or confirmed`,
      href: "/admin/orders?status=new",
    },
    {
      label: "Paid this month",
      value: money(toCedis(d.paidThisMonth.pesewas)),
      hint: `${d.paidThisMonth.count} order${d.paidThisMonth.count === 1 ? "" : "s"}`,
      href: "/admin/orders?status=paid",
    },
    { label: "Drop-list taps", value: String(d.notifyTaps), hint: "“Notify me” in the last 7 days", href: "/admin/products" },
    {
      label: "Low inventory",
      value: String(low.length),
      hint: low.length === 0 ? "Every tracked size is in stock" : `${soldOut} sold out · ${low.length - soldOut} running low`,
      href: "/admin/inventory?level=low",
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass glass-thick block rounded-[1.5rem] p-5 transition hover:-translate-y-0.5">
            <p className="text-xs tracking-[0.18em] text-ink-soft uppercase">{s.label}</p>
            <p className="mt-2 text-3xl font-light tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-ink-soft">{s.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-ink-soft underline">
              All orders
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <EmptyState title="No orders yet" body="Orders appear here the moment a customer taps “Place order on WhatsApp”." />
          ) : (
            <ul className="divide-y divide-ink/10">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.ref}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.customerName}</p>
                      <p className="text-xs text-ink-soft">
                        {o.ref} · {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} item
                        {o.items.reduce((n, i) => n + i.qty, 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-sm">{money(toCedis(o.totalPesewas))}</span>
                    <StatusPill status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-xl">Best sellers</h2>
          <p className="-mt-3 mb-4 text-xs text-ink-soft">Last 30 days</p>
          {d.bestSellers.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing sold yet.</p>
          ) : (
            <ol className="space-y-3">
              {d.bestSellers.map((b, i) => (
                <li key={b.name} className="flex items-center gap-3">
                  <span className="w-5 font-display text-lg text-gold">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{b.name}</span>
                  <span className="text-right text-xs text-ink-soft">
                    {b.qty} sold
                    <br />
                    {money(toCedis(b.revenue))}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
