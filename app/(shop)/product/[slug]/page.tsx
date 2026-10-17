import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/buy-box";
import { ProductCard } from "@/components/product-card";
import { getShopProduct, getShopProducts } from "@/lib/catalog";
import { getCategory } from "@/lib/products";

export async function generateStaticParams() {
  const products = await getShopProducts();
  // Cache Components needs at least one param; an empty shop prerenders a 404 instead.
  return products.length > 0 ? products.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getShopProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : { title: "Not found" };
}

// The shell renders instantly on navigation; the product streams in behind it.
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-10 px-4 py-8 md:grid-cols-2" aria-busy="true">
      <div className="aspect-[5/6] rounded-[1.75rem] bg-cream-deep" />
      <div className="space-y-4 pt-10">
        <div className="h-3 w-32 rounded-full bg-cream-deep" />
        <div className="h-10 w-3/4 rounded-full bg-cream-deep" />
        <div className="h-6 w-24 rounded-full bg-cream-deep" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/product/[slug]">["params"] }) {
  const product = await getShopProduct((await params).slug);
  if (!product) notFound();
  const products = await getShopProducts();

  const category = getCategory(product.category);
  const related = products
    .filter((p) => p.slug !== product.slug && (p.category === product.category || p.collection === product.collection))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 text-xs tracking-[0.18em] text-ink-soft uppercase" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link> /{" "}
        {category && <><Link href={`/category/${category.slug}`} className="hover:text-ink">{category.name}</Link> / </>}
        <span className="text-ink">{product.name}</span>
      </nav>

      <BuyBox key={product.slug} product={product} />

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-center font-display text-2xl">You may also like</h2>
          <span className="brush mt-3" />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
