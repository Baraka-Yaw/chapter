import Link from "next/link";
import { categories } from "@/lib/products";
import type { ShopSettings } from "@/lib/settings-schema";
import { brand } from "@/lib/store-config";
import { waLink } from "@/lib/whatsapp";
import { LogoMark } from "./logo";

export function Footer({ settings }: { settings: ShopSettings }) {
  return (
    <footer className="mt-24 bg-night text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display tracking-[0.28em] text-gold">CHAPTER O</span>
          </div>
          <p className="text-sm leading-relaxed text-paper/70">
            {brand.tagline}. Statement shirts, made to order{settings.location ? ` in ${settings.location}` : ""}.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-gold!">Shop</h3>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link href="/shop" className="hover:text-gold">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-gold">{c.name}</Link>
              </li>
            ))}
            <li><Link href="/drops" className="hover:text-gold">Next release</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-gold!">Help</h3>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link href="/ordering" className="hover:text-gold">Ordering & delivery</Link></li>
            <li><Link href="/size-guide" className="hover:text-gold">Size guide</Link></li>
            <li><Link href="/our-story" className="hover:text-gold">Our story</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-gold!">Contact</h3>
          <ul className="space-y-2 text-sm text-paper/80">
            <li>
              <a href={waLink(settings.whatsapp, `Hello ${brand.name}!`)} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                Call / WhatsApp {settings.phoneDisplay}
              </a>
            </li>
            {settings.instagram && (
              <li>
                <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  Instagram @{settings.instagram}
                </a>
              </li>
            )}
            {settings.tiktok && (
              <li>
                <a href={`https://www.tiktok.com/@${settings.tiktok}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  TikTok @{settings.tiktok}
                </a>
              </li>
            )}
            <li>{settings.location}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10 py-5 text-center text-xs text-paper/50">
        © {brand.name}. Made with pride in Ghana.
      </div>
    </footer>
  );
}
