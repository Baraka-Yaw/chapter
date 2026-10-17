import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin, uploadsEnabled } from "@/lib/admin/session";
import { loadAllProducts } from "@/lib/catalog";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const product = (await loadAllProducts()).find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
        ← All products
      </Link>
      <PageHeader eyebrow={saved ? "Created — the shop is updated" : "Catalogue"} title={product.name} />
      <ProductForm product={product} uploadsEnabled={uploadsEnabled()} />
    </>
  );
}
