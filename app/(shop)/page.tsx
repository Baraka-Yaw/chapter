import Link from "next/link";
import { Hero } from "@/components/hero";
import { LogoMark } from "@/components/logo";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { NotifyLink } from "@/components/notify-link";
import { getShopProducts } from "@/lib/catalog";
import { categories } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { brand } from "@/lib/store-config";
import { waLink } from "@/lib/whatsapp";

export default async function Home() {
  const [products, settings] = await Promise.all([getShopProducts(), getSettings()]);
  // Featured shirts lead the hero; fall back to the newest three if none are marked.
  const marked = products.filter((p) => p.featured);
  const featured = (marked.length > 0 ? marked : products).slice(0, 3);
  const preorders = products.filter((p) => p.status === "preorder").slice(0, 4);
  const upcoming = products.filter((p) => p.status === "coming-soon");

  return (
    <>
      <Hero
        eyebrow="Explore"
        title="Release 01"
        body={`${brand.tagline}. Statement camp-collar shirts with bold prints, made to order in Accra and delivered across Ghana.`}
        cta={{ href: "/shop", label: "View all collections" }}
        secondary={{ href: "/drops", label: "Next release" }}
        products={featured}
      />

      {/* Category tiles */}
      <section className="mx-auto mt-6 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {categories.map((c) => {
          const sample = products.find((p) => p.category === c.slug);
          if (!sample) return null;
          return (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group relative block overflow-hidden rounded-[1.75rem] bg-art">
              <ProductArt pattern={sample.pattern} colourway={sample.colourways[sample.colourways.length > 1 ? 1 : 0]} className="opacity-90 transition duration-500 group-hover:scale-105" />
              <div className="glass glass-thick absolute inset-x-3 bottom-3 rounded-2xl p-4">
                <p className="eyebrow">Explore</p>
                <h2 className="font-display text-2xl">{c.name}</h2>
                <p className="text-sm text-ink-soft">{c.blurb}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Pre-order grid */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="eyebrow">Made for you</p>
          <h2 className="mt-2 font-display text-3xl">Pre-order now</h2>
          <span className="brush mt-3" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {preorders.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn btn-outline">View all products</Link>
        </div>
      </section>

      {/* Next release teaser */}
      {upcoming.length > 0 && (
        <section className="mt-24 bg-night py-16 text-paper">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="eyebrow text-gold!">Release 02</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Next release soon</h2>
            <span className="brush mt-3" />
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
              {upcoming.map((p) => (
                <ProductArt key={p.slug} pattern={p.pattern} colourway={p.colourways[0]} className="bg-[#1d1d1d]!" />
              ))}
            </div>
            <NotifyLink
              href={waLink(settings.whatsapp, `Hello ${brand.name}! Please let me know when Release 02 drops.`)}
              className="btn glass-dark mt-10"
            >
              Notify me on WhatsApp
            </NotifyLink>
          </div>
        </section>
      )}

      {/* Story teaser */}
      <section className="mx-auto mt-24 grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div className="bg-cream-deep p-10">
          <LogoMark className="mx-auto h-40 w-40" />
        </div>
        <div>
          <p className="eyebrow">Our story</p>
          <h2 className="mt-2 font-display text-3xl">Every look starts a new chapter</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Chapter O makes bold, timeless shirts for people who like to be noticed — cut and finished by hand in Accra.
            Each release is a small, numbered collection, so pieces stay special.
          </p>
          <Link href="/our-story" className="btn btn-outline mt-6">Continue reading</Link>
        </div>
      </section>
    </>
  );
}
