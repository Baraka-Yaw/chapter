import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Catalogue } from "@/components/catalogue";
import { categories, getCategory, products } from "@/lib/products";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return { title: category?.name ?? "Not found" };
}

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-4 h-48 max-w-[1600px] animate-pulse rounded-[2rem] bg-cream-deep lg:mx-6" aria-busy="true" />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/category/[slug]">["params"] }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <Catalogue
      title={category.name}
      intro={category.blurb}
      items={products.filter((p) => p.category === category.slug)}
      activeCategory={category.slug}
    />
  );
}
