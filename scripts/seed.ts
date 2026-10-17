// Loads the placeholder catalogue and default settings into an empty database.
// Usage: pnpm db:seed            (only fills empty tables)
//        pnpm db:seed --reset    (deletes all products first; orders are kept)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { seedProducts } from "../lib/db/seed-data";
import * as schema from "../lib/db/schema";
import { defaultSettings } from "../lib/settings-schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle({ client: sql, schema, casing: "snake_case" });
const reset = process.argv.includes("--reset");

async function main() {
  await db.insert(schema.settings).values({ id: 1, data: defaultSettings }).onConflictDoNothing();

  if (reset) await db.delete(schema.products);
  const existing = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
  if (existing.length > 0) {
    console.log("Products already exist; nothing to seed. Use --reset to replace them.");
    return;
  }

  for (const [position, p] of seedProducts.entries()) {
    const [row] = await db
      .insert(schema.products)
      .values({
        slug: p.slug,
        name: p.name,
        category: p.category,
        collection: p.collection,
        pattern: p.pattern,
        status: p.status,
        description: p.description,
        details: p.details,
        sizes: p.sizes,
        featured: p.featured ?? false,
        published: true,
        position,
        createdAt: new Date(p.createdAt),
      })
      .returning({ id: schema.products.id });
    await db.insert(schema.colourways).values(
      p.colourways.map((c, i) => ({
        productId: row.id,
        key: c.id,
        name: c.name,
        pricePesewas: Math.round(c.price * 100),
        salePesewas: c.salePrice == null ? null : Math.round(c.salePrice * 100),
        palette: c.palette,
        image: c.image ?? null,
        soldOut: c.soldOut ?? false,
        position: i,
      })),
    );
  }
  console.log(`Seeded ${seedProducts.length} products and default settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
