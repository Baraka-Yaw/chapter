import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { title: "Our Story" };

// Placeholder copy — replace with Eddy's own story.
export default function OurStoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center">
        <LogoMark className="mx-auto h-20 w-20" />
        <p className="eyebrow mt-4">Our story</p>
        <h1 className="mt-2 font-display text-4xl">Every look starts a new chapter</h1>
        <span className="brush mt-3" />
      </div>

      <div className="mt-10 space-y-5 leading-relaxed text-ink-soft">
        <p>
          Chapter O began with a simple idea: a shirt should say something before you do. We design bold, camp-collar
          shirts with prints you won&apos;t see on everyone else, and finish them by hand in Accra.
        </p>
        <p>
          We release in small, numbered collections. When a release is gone, it&apos;s gone — so every piece stays
          personal. Most pieces are made to order, which means less waste and a better fit for you.
        </p>
        <p>
          Ordering is easy: choose your piece, send your order on WhatsApp, and we&apos;ll take it from there — payment,
          sizing questions and delivery, all in one chat.
        </p>
      </div>

      <div className="mt-12 grid gap-4 text-center sm:grid-cols-3">
        {[
          ["Class", "Clean cuts and considered details"],
          ["Timeless", "Prints that outlast the season"],
          ["Personal", "Small runs, made to order"],
        ].map(([title, body]) => (
          <div key={title} className="bg-cream-deep p-6">
            <h2 className="font-display text-lg tracking-widest text-gold-deep">{title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="btn btn-dark">Shop the release</Link>
      </div>
    </div>
  );
}
