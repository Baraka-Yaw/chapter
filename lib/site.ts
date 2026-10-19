// The shop's public address, for absolute links in share previews and share buttons.
// Order: explicit NEXT_PUBLIC_SITE_URL, then Vercel's production domain, then local dev.
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3100";
}

export function productUrl(slug: string) {
  return `${siteUrl()}/product/${slug}`;
}
