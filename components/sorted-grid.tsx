"use client";

import { useSearchParams } from "next/navigation";
import { sortProducts, type Product } from "@/lib/products";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

// Sorting reads ?sort= on the client so the listing pages stay static.
export function SortedGrid({ items }: { items: Product[] }) {
  const sort = useSearchParams().get("sort") ?? undefined;
  return <Grid items={sortProducts(items, sort)} controls={<SortSelect />} />;
}

export function Grid({ items, controls }: { items: Product[]; controls?: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <p className="text-sm text-ink-soft">
          {items.length === 0 ? "No products yet" : `Showing 1–${items.length} of ${items.length} results`}
        </p>
        {controls}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} />)}
      </div>
    </>
  );
}
