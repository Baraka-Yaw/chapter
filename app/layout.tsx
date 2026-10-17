import type { Metadata } from "next";
import { Cinzel, Jost } from "next/font/google";
import Script from "next/script";
import { GlassLight } from "@/components/glass-light";
import { themeScript } from "@/components/theme-toggle";
import { brand } from "@/lib/store-config";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: "Statement camp-collar shirts made to order in Accra. Pick your fit and order straight on WhatsApp.",
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
