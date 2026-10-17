// Catalogue types and helpers shared by the shop, the admin and the client.
// Products themselves live in the database (lib/catalog.ts); placeholders are in lib/db/seed-data.ts.

export type Pattern = "tiedye" | "stripes" | "dots" | "collage" | "prism" | "brush" | "plain";

export type Colourway = {
  id: string;
  name: string;
  price: number;
  // Sale price is shown with the regular price struck through.
  salePrice?: number;
  // Colours for the placeholder art: [panel base, print colour, accent].
  palette: [string, string, string];
  // Real photo path under /public, used instead of the art when set.
  image?: string;
  soldOut?: boolean;
};

export type ProductStatus = "available" | "preorder" | "coming-soon";

export type Product = {
  // Database id; absent only in seed data.
  id?: string;
  slug: string;
  name: string;
  category: CategorySlug;
  collection: string;
  pattern: Pattern;
  status: ProductStatus;
  description: string;
  details: string[];
  sizes: string[];
  colourways: Colourway[];
  featured?: boolean;
  hidden?: boolean;
  createdAt: string;
};

export const categories = [
  { slug: "shirts", name: "Shirts", blurb: "Camp-collar statement shirts" },
  { slug: "sets", name: "Sets", blurb: "Shirt and shorts, matched" },
  { slug: "tees", name: "Tees", blurb: "Clean basics to layer under" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function effectivePrice(c: Colourway) {
  return c.salePrice ?? c.price;
}

export function priceRange(p: Product): [number, number] {
  const prices = p.colourways.map(effectivePrice);
  return [Math.min(...prices), Math.max(...prices)];
}

export function onSale(p: Product) {
  return p.colourways.some((c) => c.salePrice !== undefined);
}

export const sortOptions = [
  { id: "default", label: "Default sorting" },
  { id: "latest", label: "Newest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;

export type SortId = (typeof sortOptions)[number]["id"];

export function sortProducts(list: Product[], sort: string | undefined) {
  const copy = [...list];
  switch (sort) {
    case "latest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return copy.sort((a, b) => priceRange(a)[0] - priceRange(b)[0]);
    case "price-desc":
      return copy.sort((a, b) => priceRange(b)[1] - priceRange(a)[1]);
    default:
      return copy;
  }
}

export const statusLabel: Record<ProductStatus, string> = {
  available: "In stock",
  preorder: "Pre-order",
  "coming-soon": "Coming soon",
};
