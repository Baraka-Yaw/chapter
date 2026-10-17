import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, formatDate, PageHeader } from "@/components/admin/ui";
import { getOrder } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { toCedis } from "@/lib/catalog";
import { money } from "@/lib/format";
import { brand } from "@/lib/store-config";
import { toWhatsAppNumber, waLink } from "@/lib/whatsapp";
import { StatusControl } from "./status-control";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/orders/[ref]">): Promise<Metadata> {
  return { title: `Order ${(await params).ref}` };
}

export default async function OrderPage({ params }: PageProps<"/admin/orders/[ref]">) {
  await requireAdmin();
  const order = await getOrder((await params).ref);
  if (!order) notFound();

  const firstName = order.customerName.split(" ")[0];
  const chat = waLink(toWhatsAppNumber(order.phone), `Hi ${firstName}, it's ${brand.name} about your order ${order.ref}. `);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-ink-soft hover:text-ink">
        ← All orders
      </Link>
      <PageHeader
        eyebrow={formatDate(order.createdAt)}
        title={order.ref}
        action={
          <a href={chat} target="_blank" rel="noopener noreferrer" className="btn bg-[#1f7a4d] text-white hover:bg-[#17603c]">
            Chat with {firstName}
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-display text-xl">Status</h2>
            <StatusControl orderRef={order.ref} status={order.status} />
          </Card>

          <Card>
            <h2 className="mb-4 font-display text-xl">Items</h2>
            <ul className="divide-y divide-ink/10">
              {order.items.map((i, n) => (
                <li key={n} className="flex items-start gap-3 py-3 text-sm">
                  <span className="w-8 text-ink-soft">{i.qty}×</span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {i.name}
                      {i.preorder && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] tracking-wider text-gold-deep uppercase">Pre-order</span>}
                    </p>
                    <p className="text-ink-soft">
                      {i.colour} · Size {i.size}
                    </p>
                  </div>
                  <span>{money(toCedis(i.unitPesewas * i.qty))}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{money(toCedis(order.subtotalPesewas))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>{order.deliveryPesewas ? money(toCedis(order.deliveryPesewas)) : "—"}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-medium">
                <dt>Total</dt>
                <dd>{money(toCedis(order.totalPesewas))}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="mb-4 font-display text-xl">Customer</h2>
          <dl className="space-y-3 text-sm">
            <Detail label="Name" value={order.customerName} />
            <Detail label="Phone" value={<a href={`tel:${order.phone.replace(/\s/g, "")}`} className="underline">{order.phone}</a>} />
            <Detail label="Delivery" value={order.zoneLabel} />
            {order.address && <Detail label="Address / landmark" value={order.address} />}
            <Detail label="Payment" value={order.payment} />
            {order.note && <Detail label="Note" value={order.note} />}
          </dl>
        </Card>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-ink-soft uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
