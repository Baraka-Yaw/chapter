import { z } from "zod";

// Product form as the admin submits it. Safe to import on the client for its types.
// Drafts may be incomplete (no colours, sizes or prices yet); publishProblem() decides
// whether a product is ready to go live. Sizes, stock and photos belong to each colour.

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #111111");

export const colourwayInput = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().trim().min(1, "Name each colour").max(60),
  // Null while a draft has no price yet.
  price: z.number().positive("Price must be more than 0").max(100_000).nullable(),
  salePrice: z.number().positive().max(100_000).nullable(),
  palette: z.tuple([hex, hex, hex]),
  images: z.array(z.string().url()).max(5, "Up to 5 photos per colour"),
  // Each size with its stock: `original` is the count the form was opened with (null for a new
  // size), so saving applies only the difference and never overwrites orders taken meanwhile.
  sizes: z
    .array(
      z.object({
        size: z.string().trim().min(1).max(12),
        quantity: z.number().int().min(0, "Stock can't be negative").max(10_000),
        original: z.number().int().min(0).nullable(),
      }),
    )
    .max(12),
  soldOut: z.boolean(),
});

export const productInput = z
  .object({
    id: z.string().uuid().nullable(),
    name: z.string().trim().min(2, "Give the product a name").max(100),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Web address: lowercase letters, numbers and dashes only"),
    category: z.string().min(1, "Choose a category"),
    collection: z.string().trim().max(60),
    pattern: z.enum(["tiedye", "stripes", "dots", "collage", "prism", "brush", "plain"]),
    status: z.enum(["available", "preorder", "coming-soon"]),
    description: z.string().trim().max(1000),
    details: z.array(z.string().trim().min(1).max(160)).max(12),
    featured: z.boolean(),
    published: z.boolean(),
    colourways: z.array(colourwayInput).max(12),
  })
  .superRefine((p, ctx) => {
    const keys = new Set<string>();
    p.colourways.forEach((c, i) => {
      if (keys.has(c.key)) ctx.addIssue({ code: "custom", path: ["colourways", i, "name"], message: "Two colours have the same name" });
      keys.add(c.key);
      if (new Set(c.sizes.map((s) => s.size)).size !== c.sizes.length) {
        ctx.addIssue({ code: "custom", path: ["colourways", i, "sizes"], message: `${c.name || "A colour"} has the same size twice` });
      }
      if (c.salePrice != null && c.price != null && c.salePrice >= c.price) {
        ctx.addIssue({ code: "custom", path: ["colourways", i, "salePrice"], message: "Sale price must be lower than the price" });
      }
    });
  });

export type ProductInput = z.infer<typeof productInput>;

// What still stops a product from going live, or null when it's ready.
export function publishProblem(p: { colourways: { name: string; price: number | null; sizes: unknown[] }[] }) {
  if (p.colourways.length === 0) return "Add at least one colour before publishing.";
  const unpriced = p.colourways.find((c) => c.price == null || c.price <= 0);
  if (unpriced) return `Add a price for ${unpriced.name || "every colour"} before publishing.`;
  const sizeless = p.colourways.find((c) => c.sizes.length === 0);
  if (sizeless) return `Choose at least one size for ${sizeless.name || "every colour"} before publishing.`;
  return null;
}

export type ColourwayInput = z.infer<typeof colourwayInput>;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
