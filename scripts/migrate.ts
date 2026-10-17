// Applies the committed migrations in drizzle/. Run on deploy and locally: pnpm db:migrate
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1, prepare: false });

migrate(drizzle({ client: sql }), { migrationsFolder: "drizzle" })
  .then(() => console.log("Migrations applied."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
