import type { Metadata } from "next";
import { money } from "@/lib/format";
import { deliveryZones, paymentOptions, store } from "@/lib/store-config";

export const metadata: Metadata = { title: "Ordering & Delivery" };

export default function OrderingPage() {
  const steps = [
    ["Choose", "Pick your shirt, colour and size, and add it to your bag."],
    ["Send", "At checkout, tap “Place order on WhatsApp”. Your order opens in WhatsApp — just hit send."],
    ["Pay", `We reply with payment details. We accept ${paymentOptions.join(", ").toLowerCase()}.`],
    ["Receive", "In-stock pieces go out in 1–3 days. Pre-orders are made for you in about 2 weeks."],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center">
        <p className="eyebrow">Help</p>
        <h1 className="mt-2 font-display text-4xl">Ordering & delivery</h1>
        <span className="brush mt-3" />
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2">
        {steps.map(([title, body], i) => (
          <li key={title} className="bg-cream-deep p-6">
            <span className="font-display text-3xl text-gold">{i + 1}</span>
            <h2 className="mt-1 font-display text-lg tracking-wider">{title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 font-display text-2xl">Delivery fees</h2>
      <table className="mt-4 w-full text-sm">
        <tbody className="divide-y divide-line border-y border-line">
          {deliveryZones.map((z) => (
            <tr key={z.id}>
              <td className="py-3">{z.label}</td>
              <td className="py-3 text-right">{z.fee ? money(z.fee) : z.id === "pickup" ? "Free" : "Confirmed on WhatsApp"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-10 text-sm text-ink-soft">
        Questions? Call or WhatsApp {store.phoneDisplay}.
      </p>
    </div>
  );
}
