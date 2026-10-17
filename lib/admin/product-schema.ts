import { z } from "zod";

// Product form as the admin submits it. Safe to import on the client for its types.

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #111111");

export const colourwayInput = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().trim().min(1, "Name each colour").max(60),
  price: z.number({ error: "Add a price" }).positive("Price must be more than 0").max(100_000),
  salePrice: z.number().positive().max(100_000).nullable(),
  palette: z.tuple([hex, hex, hex]),
  image: z.string().url().nullable(),
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
    sizes: z.array(z.string().trim().min(1).max(12)).min(1, "Add at least one size").max(12),
    featured: z.boolean(),
    hidden: z.boolean(),
    colourways: z.array(colourwayInput).min(1, "Add at least one colour").max(12),
  })
  .superRefine((p, ctx) => {
    const keys = new Set<string>();
    p.colourways.forEach((c, i) => {
      if (keys.has(c.key)) ctx.addIssue({ code: "custom", path: ["colourways", i, "name"], message: "Two colours have the same name" });
      keys.add(c.key);
      if (c.salePrice != null && c.salePrice >= c.price) {
        ctx.addIssue({ code: "custom", path: ["colourways", i, "salePrice"], message: "Sale price must be lower than the price" });
      }
    });
  });

export type ProductInput = z.infer<typeof productInput>;
export type ColourwayInput = z.infer<typeof colourwayInput>;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
