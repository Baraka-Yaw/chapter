import type { Metadata } from "next";
import { LogoMark } from "@/components/logo";
import { ProductCard } from "@/components/product-card";
import { NotifyLink } from "@/components/notify-link";
import { getShopProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { brand } from "@/lib/store-config";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Next Release" };

export default async function DropsPage() {
  const [products, settings] = await Promise.all([getShopProducts(), getSettings()]);
  const upcoming = products.filter((p) => p.status === "coming-soon");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 text-center">
      <LogoMark className="mx-auto h-16 w-16" />
      <p className="eyebrow mt-4">{brand.name}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Next release</h1>
      <p className="font-display text-2xl tracking-[0.2em] text-gold-deep">SOON</p>
      <span className="brush mt-3" />
      <p className="mx-auto mt-6 max-w-md text-ink-soft">
        Small runs, no restocks. Join the WhatsApp list and we&apos;ll message you the moment Release 02 opens for pre-order.
      </p>
      <NotifyLink
        href={waLink(settings.whatsapp, `Hello ${brand.name}! Please add me to the list for the next release.`)}
        className="btn btn-dark mt-6"
      >
        Join the drop list on WhatsApp
      </NotifyLink>

      <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 text-left md:grid-cols-3">
        {upcoming.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
