"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// Centred modal used by the admin: icon + title header, scrolling body, footer actions.
export function Dialog({
  open,
  onClose,
  icon,
  tone = "neutral",
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  tone?: "neutral" | "green" | "gold";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first field, or the panel itself.
    const first = panel.current?.querySelector<HTMLElement>("input, select, textarea");
    (first ?? panel.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const toneClass = { neutral: "bg-ink/8 text-ink", green: "bg-[#1f7a4d]/12 text-[#1f7a4d]", gold: "bg-gold/20 text-gold-deep" }[tone];

  // Portalled to <body> so glass cards (which isolate their stacking) can't trap it under the nav.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <div className="absolute inset-0 bg-night/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="glass glass-thick relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] outline-none"
      >
        <div className="flex items-start gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>{icon}</span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-medium">
              {title}
            </h2>
            {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-soft hover:bg-ink/8">
            ×
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink/10 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export const icons = {
  restock: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  ),
  adjust: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 103-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  ),
};
