"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Search, stock level, product status and sort for the inventory list, kept in the URL.
export function InventoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search as you type, after a short pause.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update("q", q.trim(), ""), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const select = "glass appearance-none rounded-xl py-2.5 pr-9 pl-4 text-sm";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="relative flex-1">
        <span className="sr-only">Search inventory</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, colours, sizes…"
          className="glass w-full rounded-xl py-2.5 pr-4 pl-10 text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Select label="Stock level" className={select} value={params.get("level") ?? "all"} onChange={(v) => update("level", v, "all")}>
          <option value="all">All stock levels</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </Select>
        <Select label="Product status" className={select} value={params.get("status") ?? "all"} onChange={(v) => update("status", v, "all")}>
          <option value="all">All products</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </Select>
        <Select label="Sort" className={select} value={params.get("sort") ?? "name"} onChange={(v) => update("sort", v, "name")}>
          <option value="name">Product name</option>
          <option value="stock-asc">Stock: low to high</option>
          <option value="stock-desc">Stock: high to low</option>
          <option value="updated">Last updated</option>
        </Select>
      </div>
    </div>
  );
}

function Select({
  label,
  className,
  value,
  onChange,
  children,
}: {
  label: string;
  className: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center">
      <select aria-label={label} className={className} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-3.5 h-3 w-3" aria-hidden="true">
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}
