import "server-only";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db, schema } from "./db";
import { defaultSettings, settingsSchema, type ShopSettings } from "./settings-schema";

export const SETTINGS_TAG = "settings";

// Stored settings merged over the defaults, so new fields never break an old row.
export async function getSettings(): Promise<ShopSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.id, 1) });
  const merged = { ...defaultSettings, ...((row?.data as object | undefined) ?? {}) };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultSettings;
}

export async function saveSettings(next: ShopSettings) {
  await db
    .insert(schema.settings)
    .values({ id: 1, data: next })
    .onConflictDoUpdate({ target: schema.settings.id, set: { data: next } });
}
