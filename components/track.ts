// Fire-and-forget storefront event, counted on the admin dashboard.
export function trackEvent(type: "notify", productSlug?: string) {
  try {
    const body = JSON.stringify({ type, productSlug });
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    // Tracking must never block the WhatsApp link.
  }
}
