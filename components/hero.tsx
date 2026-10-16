import Link from "next/link";
import { money } from "@/lib/format";
import { priceRange, type Product } from "@/lib/products";
import { ProductArt } from "./product-art";

// Banner like wearghana.com's, stretched to near full width with a small
// gutter; the content inside stays on the page grid.
export function Hero({
  eyebrow,
  title,
  body,
  cta,
  secondary,
  products,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  products: Product[];
}) {
  const [main, ...rest] = products;
  const from = Math.min(...products.map((p) => priceRange(p)[0]));

  return (
    <section className="mx-auto max-w-[1600px] px-4 pt-6 lg:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#2b2620] text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pt-10 pb-6 sm:px-12 md:min-h-[560px] md:grid-cols-2 md:py-24">
          <div>
            <p className="glass-dark inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-gold! uppercase">{eyebrow}</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] sm:text-6xl">{title}</h1>
            <p className="mt-6 max-w-md leading-relaxed text-paper/80">{body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta.href} className="btn bg-paper text-night hover:bg-gold">
                {cta.label}
              </Link>
              {secondary && (
                <Link href={secondary.href} className="btn glass-dark">
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,#f5f1ea_0%,#ebe4d8_45%,transparent_70%)] opacity-90" aria-hidden="true" />
            {rest.slice(0, 2).map((p, i) => (
              <ProductArt
                key={p.slug}
                pattern={p.pattern}
                colourway={p.colourways[0]}
                className={`absolute! top-6 w-[62%]! bg-transparent! opacity-85 ${i === 0 ? "-left-6" : "-right-6"}`}
              />
            ))}
            {main && (
              <ProductArt pattern={main.pattern} colourway={main.colourways[0]} priority className="relative mx-auto w-[78%]! bg-transparent! drop-shadow-2xl" />
            )}
            {/* Floating glass card over the shirts. */}
            <div className="glass-dark absolute -bottom-2 left-1/2 bg-[#1c1915]/60 w-max -translate-x-1/2 rounded-2xl px-5 py-3 text-center sm:-left-4 sm:translate-x-0">
              <p className="text-[0.65rem] tracking-[0.24em] text-[#e3c88f] uppercase">Pre-order</p>
              <p className="mt-0.5 text-sm">From {money(from)} · Ready in 2 weeks</p>
            </div>
          </div>
        </div>
        <PrintStrip />
      </div>
    </section>
  );
}

// A thin geometric print, in the brand's gold, cream and black.
export function PrintStrip() {
  return (
    <svg className="block h-3 w-full" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="co-print" width="36" height="12" patternUnits="userSpaceOnUse">
          <rect width="36" height="12" fill="#b8965a" />
          <polygon points="0,12 6,0 12,12" fill="#111111" />
          <polygon points="12,0 18,12 24,0" fill="#f5f1ea" />
          <rect x="26" y="3" width="6" height="6" fill="#111111" transform="rotate(45 29 6)" />
          <rect x="24" y="0" width="12" height="2" fill="#96773f" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill="url(#co-print)" />
    </svg>
  );
}
