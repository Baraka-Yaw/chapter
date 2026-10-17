"use client";

import { trackEvent } from "./track";

// WhatsApp "notify me" link that also counts the tap for the dashboard.
export function NotifyLink({ href, slug, className, children }: { href: string; slug?: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => trackEvent("notify", slug)}>
      {children}
    </a>
  );
}
