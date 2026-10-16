import type { Metadata } from "next";
import { Cinzel, Jost } from "next/font/google";
import Script from "next/script";
import { CartProvider } from "@/components/cart";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { GlassLight } from "@/components/glass-light";
import { AnnouncementBar, Header } from "@/components/header";
import { themeScript } from "@/components/theme-toggle";
import { store } from "@/lib/store-config";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${store.name} — ${store.tagline}`, template: `%s · ${store.name}` },
  description: "Statement camp-collar shirts made to order in Accra. Pick your fit and order straight on WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cinzel.variable} ${jost.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <Script id="theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <GlassLight />
        </CartProvider>
      </body>
    </html>
  );
}
