// Placeholder catalogue, modelled on Chapter O's release posters.
// Replace names, prices and art with real products and photos later.

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
  createdAt: string;
};

export const categories = [
  { slug: "shirts", name: "Shirts", blurb: "Camp-collar statement shirts" },
  { slug: "sets", name: "Sets", blurb: "Shirt and shorts, matched" },
  { slug: "tees", name: "Tees", blurb: "Clean basics to layer under" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

const shirtSizes = ["S", "M", "L", "XL", "XXL"];

const shirtDetails = [
  "Camp collar, short sleeves",
  "Printed front panels, solid black sleeves and back",
  "Relaxed fit — order your usual size",
  "Made to order in Accra",
];

export const products: Product[] = [
  {
    slug: "monochrome-tie-dye-shirt",
    name: "Monochrome Tie-Dye Shirt",
    category: "shirts",
    collection: "Release 01",
    pattern: "tiedye",
    status: "preorder",
    description: "Smoky black-and-white tie-dye panels framed in solid black. Easy over a white tee.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "black-white", name: "Black / White", price: 280, palette: ["#f4f2ee", "#1a1a1a", "#111111"] },
      { id: "black-gold", name: "Black / Gold", price: 300, palette: ["#efe6d2", "#2a2418", "#111111"] },
    ],
    featured: true,
    createdAt: "2026-10-01",
  },
  {
    slug: "classic-stripe-shirt",
    name: "Classic Stripe Shirt",
    category: "shirts",
    collection: "Release 01",
    pattern: "stripes",
    status: "preorder",
    description: "Bold vertical stripes for a sharp, tailored look. Dress it up or keep it casual.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "black-white", name: "Black / White", price: 280, palette: ["#f7f5f0", "#111111", "#111111"] },
      { id: "cream-gold", name: "Cream / Gold", price: 300, palette: ["#f5efe2", "#b8965a", "#111111"] },
    ],
    featured: true,
    createdAt: "2026-10-01",
  },
  {
    slug: "moon-dot-shirt",
    name: "Moon Dot Shirt",
    category: "shirts",
    collection: "Release 01",
    pattern: "dots",
    status: "preorder",
    description: "Oversized black dots on a textured white print. Playful, but still classy.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "white-black", name: "White / Black", price: 280, salePrice: 250, palette: ["#eeece8", "#111111", "#111111"] },
    ],
    featured: true,
    createdAt: "2026-10-01",
  },
  {
    slug: "abstract-collage-shirt",
    name: "Abstract Collage Shirt",
    category: "shirts",
    collection: "Release 02",
    pattern: "collage",
    status: "coming-soon",
    description: "Layered collage blocks in sage, blush and charcoal. Next release.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "sage-blush", name: "Sage / Blush", price: 320, palette: ["#e9e4dc", "#6f7f74", "#b88a86"] },
    ],
    createdAt: "2026-10-12",
  },
  {
    slug: "prism-shirt",
    name: "Prism Shirt",
    category: "shirts",
    collection: "Release 02",
    pattern: "prism",
    status: "coming-soon",
    description: "Sharp geometric triangles with flashes of gold. Next release.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "black-gold", name: "Black / Gold", price: 320, palette: ["#f3f1ec", "#111111", "#b8965a"] },
    ],
    createdAt: "2026-10-12",
  },
  {
    slug: "brushstroke-shirt",
    name: "Brushstroke Shirt",
    category: "shirts",
    collection: "Release 02",
    pattern: "brush",
    status: "coming-soon",
    description: "Painterly black strokes with a hit of red. Next release.",
    details: shirtDetails,
    sizes: shirtSizes,
    colourways: [
      { id: "red-black", name: "Red / Black", price: 320, palette: ["#f5f3ef", "#151515", "#c8402f"] },
    ],
    createdAt: "2026-10-12",
  },
  {
    slug: "stripe-shirt-and-shorts-set",
    name: "Stripe Shirt & Shorts Set",
    category: "sets",
    collection: "Release 01",
    pattern: "stripes",
    status: "preorder",
    description: "The Classic Stripe Shirt with matching shorts. One look, sorted.",
    details: ["Shirt and elastic-waist shorts", "Shorts have side pockets", "Made to order in Accra"],
    sizes: shirtSizes,
    colourways: [
      { id: "black-white", name: "Black / White", price: 450, palette: ["#f7f5f0", "#111111", "#111111"] },
    ],
    createdAt: "2026-10-05",
  },
  {
    slug: "tie-dye-shirt-and-shorts-set",
    name: "Tie-Dye Shirt & Shorts Set",
    category: "sets",
    collection: "Release 01",
    pattern: "tiedye",
    status: "preorder",
    description: "The Monochrome Tie-Dye Shirt with matching shorts.",
    details: ["Shirt and elastic-waist shorts", "Shorts have side pockets", "Made to order in Accra"],
    sizes: shirtSizes,
    colourways: [
      { id: "black-white", name: "Black / White", price: 450, palette: ["#f4f2ee", "#1a1a1a", "#111111"] },
    ],
    createdAt: "2026-10-05",
  },
  {
    slug: "essential-tee",
    name: "Essential Tee",
    category: "tees",
    collection: "Essentials",
    pattern: "plain",
    status: "available",
    description: "Heavyweight cotton tee — the one under every Chapter O shirt.",
    details: ["Heavyweight cotton", "Crew neck", "In stock — ready to deliver"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colourways: [
      { id: "white", name: "White", price: 120, palette: ["#fbfaf7", "#fbfaf7", "#fbfaf7"] },
      { id: "black", name: "Black", price: 120, palette: ["#151515", "#151515", "#151515"] },
      { id: "cream", name: "Cream", price: 120, palette: ["#efe6d2", "#efe6d2", "#efe6d2"], soldOut: true },
    ],
    createdAt: "2026-09-20",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

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
