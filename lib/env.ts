import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  // Admin sign-in. The secret signs the session cookie; use 32+ random characters.
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  ADMIN_SESSION_SECRET: z.string().min(32, "ADMIN_SESSION_SECRET must be at least 32 characters"),
  // Vercel Blob, for product photos. Optional: without it, uploads are disabled.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

let parsed: z.infer<typeof schema> | null = null;

export function env() {
  if (!parsed) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid environment: ${issues}`);
    }
    parsed = result.data;
  }
  return parsed;
}
