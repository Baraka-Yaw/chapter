"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { categories } from "@/lib/products";
import { brand } from "@/lib/store-config";
import { useCart } from "./cart";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/drops", label: "Next Release" },
  { href: "/our-story", label: "Our Story" },
];

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-night px-4 py-2 text-center text-[0.7rem] tracking-[0.18em] text-paper uppercase">
      {text}
    </div>
  );
}

export function Header() {
  const { count, setOpen, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu whenever the route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-3 z-30 px-3">
      <div className="glass glass-thick mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full pr-2 pl-5">
        <Link href="/" aria-label={`${brand.name} home`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) =>
            l.href === "/shop" ? (
              <div key={l.href} className="group relative">
                <Link href={l.href} className={`text-sm tracking-wide ${isActive(l.href) ? "text-gold-deep" : "hover:text-gold-deep"}`}>
                  Shop ▾
                </Link>
                <div className="invisible absolute left-1/2 top-full w-52 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="glass rounded-2xl p-2">
                    <Link href="/shop" className="block rounded-xl px-3 py-2 text-sm hover:bg-ink/8">All products</Link>
                    {categories.map((c) => (
                      <Link key={c.slug} href={`/category/${c.slug}`} className="block rounded-xl px-3 py-2 text-sm hover:bg-ink/8">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link key={l.href} href={l.href} className={`text-sm tracking-wide ${isActive(l.href) ? "text-gold-deep" : "hover:text-gold-deep"}`}>
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-ink/8"
            aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
          >
            <BagIcon />
            {ready && count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] font-semibold text-night">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-ink/8 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="glass mx-auto mt-2 max-w-6xl rounded-3xl px-5 pb-4 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block border-b border-ink/10 py-3 text-sm tracking-wide">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-wrap gap-2 pt-3">
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="glass rounded-full px-3 py-1.5 text-xs tracking-wider uppercase">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function BagIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}
