"use client";

import { createContext, useContext } from "react";
import type { ShopSettings } from "@/lib/settings-schema";

// Shop settings from the database, made available to client components.
const ShopSettingsContext = createContext<ShopSettings | null>(null);

export function ShopSettingsProvider({ settings, children }: { settings: ShopSettings; children: React.ReactNode }) {
  return <ShopSettingsContext.Provider value={settings}>{children}</ShopSettingsContext.Provider>;
}

export function useShopSettings() {
  const ctx = useContext(ShopSettingsContext);
  if (!ctx) throw new Error("useShopSettings must be used inside ShopSettingsProvider");
  return ctx;
}
