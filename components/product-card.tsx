import Link from "next/link";
import { priceLabel } from "@/lib/format";
import { onSale, priceRange, statusLabel, type Product } from "@/lib/products";
import { ProductArt } from "./product-art";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const sale = onSale(product);
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl">
        <ProductArt pattern={product.pattern} colourway={product.colourways[0]} priority={priority} className="transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.status !== "available" && (
            <span className={`rounded-full px-2.5 py-1 text-[0.62rem] tracking-[0.2em] uppercase ${product.status === "preorder" ? "glass glass-light" : "glass glass-light text-[#96773f]!"}`}>
              {statusLabel[product.status]}
            </span>
          )}
          {sale && <span className="rounded-full bg-[#c8402f]/85 px-2.5 py-1 text-[0.62rem] tracking-[0.2em] text-white uppercase backdrop-blur">Sale</span>}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-center">
        <h3 className="text-sm leading-snug group-hover:text-gold-deep">{product.name}</h3>
        <p className="text-sm text-ink-soft">{priceLabel(priceRange(product))}</p>
        {product.colourways.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-1" aria-label={`${product.colourways.length} colours`}>
            {product.colourways.map((c) => (
              <span key={c.id} className="h-3 w-3 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${c.palette[0]} 50%, ${c.palette[1]} 50%)` }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
