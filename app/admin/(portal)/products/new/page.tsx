import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin, uploadsEnabled } from "@/lib/admin/session";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
        ← All products
      </Link>
      <PageHeader eyebrow="Catalogue" title="New product" />
      <ProductForm uploadsEnabled={uploadsEnabled()} />
    </>
  );
}
