import type { Metadata } from "next";
import { Cinzel, Jost } from "next/font/google";
import Script from "next/script";
import { GlassLight } from "@/components/glass-light";
import { themeScript } from "@/components/theme-toggle";
import { siteUrl } from "@/lib/site";
import { brand } from "@/lib/store-config";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

const description = "Statement camp-collar shirts made to order in Accra. Pick your fit and order straight on WhatsApp.";

export const metadata: Metadata = {
  // Lets share previews (WhatsApp, Facebook, X…) use relative image and page URLs.
  metadataBase: new URL(siteUrl()),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description,
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_GH",
    title: `${brand.name} — ${brand.tagline}`,
    description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cinzel.variable} ${jost.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <Script id="theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <GlassLight />
      </body>
    </html>
  );
}
