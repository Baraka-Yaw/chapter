import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { ProductArt } from "@/components/product-art";
import { requireAdmin } from "@/lib/admin/session";
import { loadAllProducts } from "@/lib/catalog";
import { priceLabel } from "@/lib/format";
import { getCategory, priceRange, statusLabel } from "@/lib/products";
import { VisibilityToggle } from "./visibility-toggle";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireAdmin();
  const products = await loadAllProducts();

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

      <Card className="p-0! sm:p-0!">
        {products.length === 0 ? (
          <EmptyState title="No products yet" body="Add your first shirt to open the shop." href="/admin/products/new" cta="Add a product" />
        ) : (
          <ul className="divide-y divide-ink/10">
            {products.map((p) => (
              <li key={p.id} className={`flex items-center gap-4 px-4 py-3 sm:px-5 ${p.hidden ? "opacity-60" : ""}`}>
                <Link href={`/admin/products/${p.id}`} className="w-14 shrink-0 overflow-hidden rounded-xl">
                  {p.colourways[0] ? (
                    <ProductArt pattern={p.pattern} colourway={p.colourways[0]} />
                  ) : (
                    <div className="aspect-[5/6] bg-cream-deep" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {getCategory(p.category)?.name ?? p.category} · {statusLabel[p.status]} ·{" "}
                    {p.colourways.length} colour{p.colourways.length === 1 ? "" : "s"}
                    {p.featured && " · Featured"}
                  </p>
                </div>
                <span className="hidden text-sm sm:block">{p.colourways.length ? priceLabel(priceRange(p)) : "—"}</span>
                <VisibilityToggle id={p.id!} hidden={!!p.hidden} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
