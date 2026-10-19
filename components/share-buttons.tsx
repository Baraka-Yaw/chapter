"use client";

import { useState, useSyncExternalStore } from "react";
import { shareLinks } from "@/lib/share";

// Share a shop page. Phones get the system share sheet (Instagram, TikTok, Snapchat…);
// every device gets WhatsApp, Facebook, X and Copy link. The link's preview card comes from
// the page's opengraph-image. `path` is relative to the shop, e.g. /product/classic-stripe-shirt.
const noop = () => () => {};
const useOrigin = () => useSyncExternalStore(noop, () => window.location.origin, () => null);

function useCopy(url: string | null) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return [copied, copy] as const;
}

// A single "Copy link" button, for tight spots like the admin product list.
export function CopyLinkButton({ path, className = "" }: { path: string; className?: string }) {
  const origin = useOrigin();
  const [copied, copy] = useCopy(origin && `${origin}${path}`);
  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}

export function ShareButtons({ path, text, title, className = "" }: { path: string; text: string; title: string; className?: string }) {
  // The page's own address, so links work on whichever domain the shop is opened on.
  const origin = useOrigin();
  const canShare = useSyncExternalStore(noop, () => typeof navigator.share === "function", () => false);
  const url = origin && `${origin}${path}`;
  const [copied, copy] = useCopy(url);

  async function nativeShare() {
    if (!url) return;
    try {
      await navigator.share({ title, text, url });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  const links = url ? shareLinks(url, text) : null;
  const pill = "rounded-full border border-line px-3.5 py-1.5 text-xs tracking-wide transition hover:border-ink hover:text-ink";

  return (
    <div className={`flex flex-wrap items-center gap-2 text-ink-soft ${className}`}>
      <span className="mr-1 text-xs tracking-[0.18em] uppercase">Share</span>
      {canShare && (
        <button type="button" onClick={nativeShare} className={`${pill} bg-ink text-paper hover:text-paper`}>
          Share…
        </button>
      )}
      {links && (
        <>
          <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={pill}>WhatsApp</a>
          <a href={links.facebook} target="_blank" rel="noopener noreferrer" className={pill}>Facebook</a>
          <a href={links.x} target="_blank" rel="noopener noreferrer" className={pill}>X</a>
        </>
      )}
      <button type="button" onClick={copy} className={pill} aria-live="polite">
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
