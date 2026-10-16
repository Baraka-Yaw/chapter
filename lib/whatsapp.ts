import { money } from "./format";
import { store } from "./store-config";

export type OrderLine = {
  name: string;
  colour: string;
  size: string;
  qty: number;
  unitPrice: number;
  preorder: boolean;
};

export type OrderDetails = {
  orderRef: string;
  customerName: string;
  phone: string;
  zoneLabel: string;
  deliveryFee: number;
  address: string;
  payment: string;
  note: string;
};

export function waLink(text: string) {
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function orderMessage(lines: OrderLine[], d: OrderDetails) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const items = lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name}${l.preorder ? " (pre-order)" : ""}\n   ${l.colour} · Size ${l.size} · Qty ${l.qty} · ${money(l.unitPrice * l.qty)}`,
    )
    .join("\n");

  return [
    `Hello ${store.name}! I'd like to place an order 🛍️`,
    `Order ref: ${d.orderRef}`,
    "",
    items,
    "",
    `Subtotal: ${money(subtotal)}`,
    `Delivery: ${d.zoneLabel}${d.deliveryFee ? ` (${money(d.deliveryFee)})` : ""}`,
    `Total: ${money(subtotal + d.deliveryFee)}`,
    "",
    `Name: ${d.customerName}`,
    `Phone: ${d.phone}`,
    d.address ? `Address / landmark: ${d.address}` : null,
    `Payment: ${d.payment}`,
    d.note ? `Note: ${d.note}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function newOrderRef() {
  const now = new Date();
  const date = `${now.getFullYear() % 100}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CO-${date}-${random}`;
}
