import Link from "next/link";
import { Suspense } from "react";
import { categories, type Product } from "@/lib/products";
import { Grid, SortedGrid } from "./sorted-grid";

// Shared listing for /shop and /category/[slug].
export function Catalogue({
  title,
  intro,
  items,
  activeCategory,
}: {
  title: string;
  intro: string;
  items: Product[];
  activeCategory?: string;
}) {
  return (
    <>
      <section className="glass mx-auto mt-4 max-w-[1600px] rounded-[2rem] py-14 text-center lg:mx-6">
        <p className="eyebrow">
          <Link href="/" className="hover:underline">Home</Link> / {title}
        </p>
        <h1 className="mt-3 font-display text-4xl">{title}</h1>
        <p className="mt-2 text-ink-soft">{intro}</p>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap gap-2 pt-8">
          <Chip href="/shop" active={!activeCategory}>All</Chip>
          {categories.map((c) => (
            <Chip key={c.slug} href={`/category/${c.slug}`} active={activeCategory === c.slug}>{c.name}</Chip>
          ))}
        </div>

        <Suspense fallback={<Grid items={items} />}>
          <SortedGrid items={items} />
        </Suspense>
      </div>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-xs tracking-[0.18em] uppercase transition ${active ? "bg-ink text-cream" : "glass"}`}
    >
      {children}
    </Link>
  );
}
