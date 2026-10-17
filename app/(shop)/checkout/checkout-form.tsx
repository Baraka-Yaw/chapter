"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart";
import { ProductArt } from "@/components/product-art";
import { useShopSettings } from "@/components/shop-settings";
import { money } from "@/lib/format";
import { placeOrder } from "@/lib/order-actions";

type Sent = { ref: string; link: string };

export function CheckoutForm() {
  const { lines, items, subtotal, ready, clear } = useCart();
  const { deliveryZones, paymentOptions, phoneDisplay } = useShopSettings();
  const [zoneId, setZoneId] = useState((deliveryZones[1] ?? deliveryZones[0]).id);
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const zone = deliveryZones.find((z) => z.id === zoneId) ?? deliveryZones[0];
  const total = subtotal + zone.fee;

  if (sent) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="eyebrow">Order {sent.ref}</p>
        <h2 className="mt-3 font-display text-3xl">Almost done!</h2>
        <p className="mt-4 text-ink-soft">
          WhatsApp should have opened with your order written out. Tap <strong>send</strong> so it reaches us, and
          we&apos;ll reply with payment details and your delivery date.
        </p>
        <a href={sent.link} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-8">
          WhatsApp didn&apos;t open? Tap here
        </a>
        <div className="mt-4">
          <Link href="/shop" className="text-sm underline">Continue shopping</Link>
        </div>
      </div>
    );
  }

  if (!ready) return <p className="py-10 text-center text-ink-soft">Loading your bag…</p>;

  if (lines.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-ink-soft">Your bag is empty.</p>
        <Link href="/shop" className="btn btn-dark mt-6">Shop now</Link>
      </div>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    // Open the tab during the tap so popup blockers allow it; it's pointed at WhatsApp once the order is saved.
    const tab = window.open("", "_blank");
    startTransition(async () => {
      const result = await placeOrder({
        items,
        customerName: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        zoneId: zone.id,
        address: String(form.get("address") ?? ""),
        payment: String(form.get("payment") ?? ""),
        note: String(form.get("note") ?? ""),
        website: String(form.get("website") ?? ""),
      }).catch(() => ({ ok: false as const, error: "We couldn't reach the shop. Check your connection and try again." }));

      if (!result.ok) {
        tab?.close();
        setError(result.error);
        return;
      }
      if (tab) tab.location.href = result.waUrl;
      else window.location.href = result.waUrl;
      clear();
      setSent({ ref: result.ref, link: result.waUrl });
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <h2 className="font-display text-xl tracking-wider">Your details</h2>
        {/* Honeypot: hidden from people, often filled in by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" autoComplete="name" required />
          <Field label="Phone (WhatsApp)" name="phone" type="tel" autoComplete="tel" placeholder="024 000 0000" required pattern="[0-9+ ]{9,16}" />
        </div>

        <label className="block">
          <span className="text-xs tracking-[0.18em] uppercase">Delivery area</span>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="glass mt-2 w-full rounded-xl px-4 py-3">
            {deliveryZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}{z.fee ? ` — ${money(z.fee)}` : ""}
              </option>
            ))}
          </select>
        </label>

        {zone.id !== "pickup" && (
          <Field label="Address / nearest landmark" name="address" autoComplete="street-address" placeholder="e.g. East Legon, near A&C Mall" required />
        )}

        <fieldset>
          <legend className="text-xs tracking-[0.18em] uppercase">How would you like to pay?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {paymentOptions.map((p, i) => (
              <label key={p} className="glass flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm has-[:checked]:outline-2 has-[:checked]:outline-ink">
                <input type="radio" name="payment" value={p} defaultChecked={i === 0} className="accent-ink" />
                {p}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">No payment on this site. We&apos;ll send payment details on WhatsApp.</p>
        </fieldset>

        <label className="block">
          <span className="text-xs tracking-[0.18em] uppercase">Note (optional)</span>
          <textarea name="note" rows={3} className="glass mt-2 w-full rounded-xl px-4 py-3" placeholder="Anything we should know?" />
        </label>
      </div>

      <aside className="glass glass-thick h-fit space-y-4 rounded-[1.75rem] p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl tracking-wider">Your order</h2>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-3 py-3 text-sm">
              <div className="w-14 shrink-0 overflow-hidden rounded-lg">
                <ProductArt pattern={l.product.pattern} colourway={l.colourway} />
              </div>
              <div className="flex-1">
                <p>{l.product.name} × {l.qty}</p>
                <p className="text-ink-soft">{l.colourway.name} · {l.size}</p>
              </div>
              <span>{money(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-line pt-3 text-sm">
          <Row label="Subtotal" value={money(subtotal)} />
          <Row label="Delivery" value={zone.fee ? money(zone.fee) : zone.id === "pickup" ? "Free" : "To confirm"} />
          <Row label="Total" value={money(total)} strong />
        </dl>
        {error && (
          <p role="alert" className="rounded-xl bg-[#c8402f]/10 px-4 py-3 text-sm text-[#a5321f]">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn w-full bg-[#1f7a4d] text-white hover:bg-[#17603c]">
          <WhatsAppIcon /> {pending ? "Saving your order…" : "Place order on WhatsApp"}
        </button>
        <p className="text-center text-xs text-ink-soft">
          Opens WhatsApp to {phoneDisplay} with your order ready to send.
        </p>
      </aside>
    </form>
  );
}

function Field({ label, ...input }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.18em] uppercase">{label}</span>
      <input {...input} className="glass mt-2 w-full rounded-xl px-4 py-3" />
    </label>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-2 text-base font-medium" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 001.8-1.3 2.3 2.3 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}
