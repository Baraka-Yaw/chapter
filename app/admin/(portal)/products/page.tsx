import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { Pagination, parsePage } from "@/components/pagination";
import { ProductArt } from "@/components/product-art";
import { requireAdmin } from "@/lib/admin/session";
import { loadAllProducts } from "@/lib/catalog";
import { priceLabel } from "@/lib/format";
import { getCategory, priceRange, statusLabel, type Product } from "@/lib/products";
import { PublishToggle } from "./publish-toggle";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 20;

const views = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
] as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const query = await searchParams;
  const view = views.find((v) => v.id === query.view)?.id ?? "all";
  const all = await loadAllProducts();
  const counts = { all: all.length, published: all.filter((p) => !p.draft).length, drafts: all.filter((p) => p.draft).length };
  const matching = all.filter((p) => (view === "drafts" ? p.draft : view === "published" ? !p.draft : true));
  const pageCount = Math.ceil(matching.length / PAGE_SIZE);
  const page = parsePage(query.page, pageCount);
  const products = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (p: number) => {
    const qs = new URLSearchParams({ ...(view !== "all" ? { view } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        action={
          <Link href="/admin/products/new" className="btn btn-dark">
            + New product
          </Link>
        }
      />

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Filter products">
        {views.map((v) => (
          <Link
            key={v.id}
            href={v.id === "all" ? "/admin/products" : `/admin/products?view=${v.id}`}
            aria-current={view === v.id ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${view === v.id ? "bg-ink text-cream" : "glass"}`}
          >
            {v.label}
            <span className={`rounded-full px-1.5 text-xs ${view === v.id ? "bg-cream/20" : "bg-ink/8"}`}>{counts[v.id]}</span>
          </Link>
        ))}
      </nav>

      <Card className="p-0! sm:p-0!">
        {products.length === 0 ? (
          view === "drafts" ? (
            <EmptyState title="No drafts" body="Save a product as a draft to finish it later." href="/admin/products/new" cta="Start a product" />
          ) : (
            <EmptyState title="No products yet" body="Add your first shirt to open the shop." href="/admin/products/new" cta="Add a product" />
          )
        ) : (
          <ul className="divide-y divide-ink/10">
            {products.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
        )}
      </Card>
      <Pagination page={page} pageCount={pageCount} href={pageHref} />
    </>
  );
}

function ProductRow({ product: p }: { product: Product }) {
  const priced = p.colourways.filter((c) => c.price > 0);
  return (
    <li className="flex items-center gap-4 px-4 py-3 sm:px-5">
      <Link href={`/admin/products/${p.id}`} className={`w-14 shrink-0 overflow-hidden rounded-xl ${p.draft ? "opacity-70" : ""}`}>
        {p.colourways[0] ? <ProductArt pattern={p.pattern} colourway={p.colourways[0]} /> : <div className="aspect-[5/6] bg-cream-deep" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
            {p.name}
          </Link>
          {p.draft && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] tracking-wider text-gold-deep uppercase">Draft</span>}
        </div>
        <p className="text-xs text-ink-soft">
          {getCategory(p.category)?.name ?? p.category} · {statusLabel[p.status]} · {p.colourways.length} colour
          {p.colourways.length === 1 ? "" : "s"}
          {p.featured && " · Featured"}
        </p>
      </div>
      <span className="hidden text-sm sm:block">{priced.length ? priceLabel(priceRange({ ...p, colourways: priced })) : "No price yet"}</span>
      <PublishToggle id={p.id!} published={!p.draft} />
    </li>
  );
}
