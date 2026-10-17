import { CartProvider } from "@/components/cart";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { AnnouncementBar, Header } from "@/components/header";
import { ShopSettingsProvider } from "@/components/shop-settings";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <ShopSettingsProvider settings={settings}>
      <CartProvider>
        {settings.preorderNotice && <AnnouncementBar text={settings.preorderNotice} />}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
        <CartDrawer />
      </CartProvider>
    </ShopSettingsProvider>
  );
}
