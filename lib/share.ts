import { money } from "./format";
import { brand } from "./store-config";
import { priceRange, type Product } from "./products";

// Price as shown in share previews: "GH₵350.00", or "From GH₵300.00" when colours differ.
export function shareLine(p: Product) {
  if (p.colourways.length === 0) return "";
  const [low, high] = priceRange(p);
  return low === high ? money(low) : `From ${money(low)}`;
}

// The message that goes with a shared product link.
export function shareText(p: Product) {
  const price = shareLine(p);
  return `${p.name}${price ? ` — ${price}` : ""} at ${brand.name}`;
}

// Share pages for each network. They read the link's preview (opengraph-image.tsx) themselves.
export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${u}`,
  };
}
