import { money } from "./format";
import { brand } from "./store-config";

// `number` is international format without "+", e.g. 233559672901.
export function waLink(number: string, text?: string) {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// Ghana numbers as typed by customers (024…, +233 24…) → 233XXXXXXXXX for wa.me links.
export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return digits;
}

export type OrderMessageInput = {
  ref: string;
  lines: { name: string; colour: string; size: string; qty: number; unitPrice: number; preorder: boolean }[];
  subtotal: number;
  deliveryFee: number;
  zoneLabel: string;
  customerName: string;
  phone: string;
  address: string;
  payment: string;
  note: string;
};

export function orderMessage(o: OrderMessageInput) {
  const items = o.lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name}${l.preorder ? " (pre-order)" : ""}\n   ${l.colour} · Size ${l.size} · Qty ${l.qty} · ${money(l.unitPrice * l.qty)}`,
    )
    .join("\n");

  return [
    `Hello ${brand.name}! I'd like to place an order 🛍️`,
    `Order ref: ${o.ref}`,
    "",
    items,
    "",
    `Subtotal: ${money(o.subtotal)}`,
    `Delivery: ${o.zoneLabel}${o.deliveryFee ? ` (${money(o.deliveryFee)})` : ""}`,
    `Total: ${money(o.subtotal + o.deliveryFee)}`,
    "",
    `Name: ${o.customerName}`,
    `Phone: ${o.phone}`,
    o.address ? `Address / landmark: ${o.address}` : null,
    `Payment: ${o.payment}`,
    o.note ? `Note: ${o.note}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
