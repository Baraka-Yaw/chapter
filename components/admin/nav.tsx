"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/admin", label: "Dashboard", icon: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" },
  { href: "/admin/orders", label: "Orders", icon: "M6 7h12l-1 13H7L6 7zm3 0V6a3 3 0 016 0v1" },
  { href: "/admin/products", label: "Products", icon: "M8 4l4 2 4-2 4 3-2 3h-2v10H8V10H6L4 7l4-3z" },
  { href: "/admin/inventory", label: "Inventory", icon: "M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0l8 4 8-4M12 11v10" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2-1.2L14.5 2h-5l-.4 2.6a7.6 7.6 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// Reads the current path to highlight the active link. Render inside <Suspense> with
// <AdminNavView pathname={null} /> as the fallback, since the path is only known at request time.
export function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

export function AdminNavView({ pathname }: { pathname: string | null }) {
  const active = (href: string) => pathname !== null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-30 p-3 md:h-screen md:w-64 md:shrink-0">
      <div className="glass glass-thick flex items-center gap-1 rounded-full px-3 py-2 md:h-full md:flex-col md:items-stretch md:gap-1 md:rounded-[2rem] md:p-4">
        <Link href="/admin" className="mr-2 flex items-center gap-2 md:mr-0 md:mb-6 md:px-2 md:pt-2">
          <LogoMark className="h-9 w-9" />
          <span className="hidden flex-col leading-tight md:flex">
            <span className="font-display text-sm tracking-[0.2em] text-gold-deep">CHAPTER O</span>
            <span className="text-xs text-ink-soft">Shop admin</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col md:items-stretch" aria-label="Admin">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm whitespace-nowrap transition md:rounded-2xl md:px-4 md:py-3 ${
                active(l.href) ? "bg-ink text-cream" : "hover:bg-ink/8"
              }`}
            >
              <Icon d={l.icon} />
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:mt-auto md:flex-col md:items-stretch md:gap-2 md:border-t md:border-ink/10 md:pt-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-ink/8 md:flex"
          >
            <Icon d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
            View shop
          </a>
          <div className="flex items-center justify-between md:px-2">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-ink/8 hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
