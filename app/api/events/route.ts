import { z } from "zod";
import { db, schema } from "@/lib/db";

const eventSchema = z.object({
  type: z.enum(["notify"]),
  productSlug: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "bad_request", message: "Invalid event" } }, { status: 400 });
  await db.insert(schema.events).values({ type: parsed.data.type, productSlug: parsed.data.productSlug ?? null });
  return new Response(null, { status: 204 });
}
