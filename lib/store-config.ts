// Shop settings. Swap these when Eddy confirms the details.
export const store = {
  name: "Chapter O Wear",
  tagline: "Class & timeless",
  // International format, no "+" or spaces: used for wa.me links.
  whatsapp: "233542343611",
  phoneDisplay: "054 234 3611",
  instagram: "chapterowear",
  tiktok: "chapterowear",
  location: "Accra, Ghana",
  preorderNotice: "Pre-orders take up to 2 weeks to make. Orders are confirmed on WhatsApp.",
  currency: "GH₵",
} as const;

export type DeliveryZone = { id: string; label: string; fee: number };

// Placeholder zones and fees.
export const deliveryZones: DeliveryZone[] = [
  { id: "pickup", label: "Pick up (we'll share the location)", fee: 0 },
  { id: "accra-central", label: "Accra – Central (Osu, Airport, Labone…)", fee: 30 },
  { id: "accra-outer", label: "Accra – Outer (Madina, Kasoa, Tema…)", fee: 45 },
  { id: "kumasi", label: "Kumasi", fee: 60 },
  { id: "other", label: "Other region (fee confirmed on WhatsApp)", fee: 0 },
];

export const paymentOptions = [
  "Mobile Money (MoMo)",
  "Cash on delivery",
  "Bank transfer",
] as const;
