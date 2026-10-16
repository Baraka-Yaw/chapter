// Placeholder mark: crown over two linked rings, in gold. Swap for Eddy's logo file.
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" stroke="var(--gold)" strokeWidth="2.2">
      <path d="M20 18 L22 8 L27 14 L32 6 L37 14 L42 8 L44 18 Z" strokeLinejoin="round" />
      <circle cx="25" cy="38" r="13" />
      <circle cx="39" cy="38" r="13" />
      <circle cx="25" cy="38" r="9" strokeWidth="1.2" />
      <circle cx="39" cy="38" r="9" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="font-display text-sm tracking-[0.28em] text-gold-deep sm:text-base">CHAPTER O</span>
    </span>
  );
}
