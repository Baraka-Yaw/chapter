"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { sortProducts, type Product } from "@/lib/products";
import { Pagination, parsePage } from "./pagination";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

export const PAGE_SIZE = 12;

// Sorting and paging read ?sort= and ?page= on the client so the listing pages stay static.
export function SortedGrid({ items }: { items: Product[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const sorted = sortProducts(items, params.get("sort") ?? undefined);
  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const page = parsePage(params.get("page"), pageCount);

  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <>
      <Grid items={sorted} page={page} controls={<SortSelect />} />
      <Pagination page={page} pageCount={pageCount} href={href} />
    </>
  );
}

// One page of the grid. Also the server-rendered fallback (page 1, default order) before the URL is read.
export function Grid({ items, page = 1, controls }: { items: Product[]; page?: number; controls?: React.ReactNode }) {
  const start = (page - 1) * PAGE_SIZE;
  const shown = items.slice(start, start + PAGE_SIZE);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <p className="text-sm text-ink-soft">
          {items.length === 0
            ? "No products yet"
            : `Showing ${start + 1}–${start + shown.length} of ${items.length} result${items.length === 1 ? "" : "s"}`}
        </p>
        {controls}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < 4} />
        ))}
      </div>
    </>
  );
}
