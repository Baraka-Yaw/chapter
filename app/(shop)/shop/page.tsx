import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { getShopProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await getShopProducts();
  return (
    <Catalogue
      title="Shop"
      intro="Wearable statements, made to order."
      items={products}
    />
  );
}
