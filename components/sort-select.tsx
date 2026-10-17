"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortOptions } from "@/lib/products";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label="Sort products"
        value={params.get("sort") ?? "default"}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          // A new order starts again from the first page.
          next.delete("page");
          if (e.target.value === "default") next.delete("sort");
          else next.set("sort", e.target.value);
          const qs = next.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="glass cursor-pointer appearance-none rounded-full py-2 pr-9 pl-4 text-sm"
      >
        {sortOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-3.5 h-3 w-3" aria-hidden="true">
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}
