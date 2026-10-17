import Link from "next/link";

// Page links: ← 1 2 … 7 8 9 … 20 →. Works in server and client components.
export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pages">
      <PageLink href={page > 1 ? href(page - 1) : null} label="Previous page">
        ←
      </PageLink>
      {pagesToShow(page, pageCount).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-ink-soft" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition ${p === page ? "bg-ink text-cream" : "glass"}`}
          >
            {p}
          </Link>
        ),
      )}
      <PageLink href={page < pageCount ? href(page + 1) : null} label="Next page">
        →
      </PageLink>
    </nav>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const className = "flex h-10 w-10 items-center justify-center rounded-full text-sm";
  if (!href) {
    return (
      <span className={`${className} opacity-30`} aria-hidden="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${className} glass`}>
      {children}
    </Link>
  );
}

// First, last, and the current page with one neighbour each side; null marks a gap.
function pagesToShow(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : null);
    out.push(p);
  });
  return out;
}

// Reads ?page= safely: anything odd falls back to 1, too high clamps to the last page.
export function parsePage(raw: string | string[] | null | undefined, pageCount: number) {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, pageCount));
}
