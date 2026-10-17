"use server";

import { z } from "zod";
import { getShopProducts } from "./catalog";
import type { Product } from "./products";

const slugs = z.array(z.string().max(120)).max(50);

// Current details for the products in a saved bag; unknown or hidden slugs are left out.
export async function lookupProducts(input: string[]): Promise<Product[]> {
  const wanted = new Set(slugs.parse(input));
  if (wanted.size === 0) return [];
  const all = await getShopProducts();
  return all.filter((p) => wanted.has(p.slug));
}
