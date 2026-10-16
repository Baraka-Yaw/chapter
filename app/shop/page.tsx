import type { Metadata } from "next";
import { Catalogue } from "@/components/catalogue";
import { products } from "@/lib/products";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <Catalogue
      title="Shop"
      intro="Wearable statements, made to order."
      items={products}
    />
  );
}
