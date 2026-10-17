import { brand } from "./store-config";

export function money(amount: number) {
  return `${brand.currency}${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function priceLabel([min, max]: [number, number]) {
  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
}
