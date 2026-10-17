import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryTable } from "@/components/admin/inventory-table";
import { ProductForm } from "@/components/admin/product-form";
import { Card, PageHeader } from "@/components/admin/ui";
import { listInventory } from "@/lib/admin/inventory-queries";
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
  const inventory = product.trackInventory ? await listInventory({ productId: product.id, pageSize: 200 }) : null;
  const pieces = inventory?.variants.reduce((n, v) => n + v.quantity, 0) ?? 0;

  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
        ← All products
      </Link>
      <PageHeader
        eyebrow={saved === "published" ? "Created and published — it's live in the shop" : saved === "draft" ? "Draft saved — not visible in the shop yet" : "Catalogue"}
        title={product.name}
      />
      <ProductForm product={product} uploadsEnabled={uploadsEnabled()} />
      {inventory && (
        <Card className="mt-6 p-0! sm:p-0!">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/10 p-5">
            <div>
              <h2 className="font-display text-xl">Inventory</h2>
              <p className="text-sm text-ink-soft">
                {pieces} piece{pieces === 1 ? "" : "s"} available across {inventory.total} variant{inventory.total === 1 ? "" : "s"}
              </p>
            </div>
            <Link href={`/admin/inventory?q=${encodeURIComponent(product.name)}`} className="text-sm text-ink-soft underline">
              Open in Inventory
            </Link>
          </div>
          {inventory.total === 0 ? (
            <p className="p-5 text-sm text-ink-soft">Add colours and sizes, then save, to start counting inventory.</p>
          ) : (
            <InventoryTable variants={inventory.variants} showProduct={false} />
          )}
        </Card>
      )}
    </>
  );
}
