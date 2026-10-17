import Link from "next/link";
import { orderStatusLabel, type OrderStatus } from "@/lib/admin/order-status";

// Small building blocks shared by the admin pages.

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`glass glass-thick rounded-[1.5rem] p-5 sm:p-6 ${className}`}>{children}</section>;
}

const statusTone: Record<OrderStatus, string> = {
  new: "bg-gold/25 text-gold-deep",
  confirmed: "bg-[#3b82f6]/15 text-[#2f6fd6]",
  paid: "bg-[#1f7a4d]/15 text-[#1f7a4d]",
  made: "bg-[#7c5cc4]/15 text-[#7c5cc4]",
  delivered: "bg-ink/10 text-ink",
  cancelled: "bg-[#c8402f]/12 text-[#c8402f]",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-medium tracking-wider uppercase ${statusTone[status]}`}>
      {orderStatusLabel[status]}
    </span>
  );
}

export function EmptyState({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
      {href && cta && (
        <Link href={href} className="btn btn-dark mt-6">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function formatDate(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });
}
