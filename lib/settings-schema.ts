import { z } from "zod";

// Shop settings Eddy edits in the admin. Safe to import on the client.

export const deliveryZoneSchema = z.object({
  id: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1, "Give the area a name").max(80),
  // GH₵; 0 means free (pickup) or "confirmed on WhatsApp".
  fee: z.number().min(0).max(10_000),
});

export const settingsSchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .regex(/^233\d{9}$/, "Use the international format without + or spaces, e.g. 233542343611"),
  phoneDisplay: z.string().trim().min(1, "Add the number as customers should see it").max(30),
  instagram: z.string().trim().max(40),
  tiktok: z.string().trim().max(40),
  location: z.string().trim().max(60),
  preorderNotice: z.string().trim().max(160),
  deliveryZones: z.array(deliveryZoneSchema).min(1, "Add at least one delivery option").max(20),
  paymentOptions: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one payment option").max(6),
});

export type ShopSettings = z.infer<typeof settingsSchema>;
export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;

export const defaultSettings: ShopSettings = {
  whatsapp: "233542343611",
  phoneDisplay: "054 234 3611",
  instagram: "chapterowear",
  tiktok: "chapterowear",
  location: "Accra, Ghana",
  preorderNotice: "Pre-orders take up to 2 weeks to make. Orders are confirmed on WhatsApp.",
  deliveryZones: [
    { id: "pickup", label: "Pick up (we'll share the location)", fee: 0 },
    { id: "accra-central", label: "Accra – Central (Osu, Airport, Labone…)", fee: 30 },
    { id: "accra-outer", label: "Accra – Outer (Madina, Kasoa, Tema…)", fee: 45 },
    { id: "kumasi", label: "Kumasi", fee: 60 },
    { id: "other", label: "Other region (fee confirmed on WhatsApp)", fee: 0 },
  ],
  paymentOptions: ["Mobile Money (MoMo)", "Cash on delivery", "Bank transfer"],
};
