"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { effectivePrice, getProduct, type Colourway, type Product } from "@/lib/products";

export type CartItem = { slug: string; colourwayId: string; size: string; qty: number };

export type CartLine = CartItem & { key: string; product: Product; colourway: Colourway; unitPrice: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "chapter-o-bag";

const keyOf = (i: CartItem) => `${i.slug}|${i.colourwayId}|${i.size}`;

function load(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Restore the saved bag after hydration so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable (private mode); the bag still works for this visit.
    }
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => keyOf(p) === keyOf(item));
      if (existing) return prev.map((p) => (p === existing ? { ...p, qty: p.qty + item.qty } : p));
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((p) => (keyOf(p) === key ? { ...p, qty: Math.max(1, Math.min(20, qty)) } : p)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => keyOf(p) !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    // Prices come from the catalogue, never from storage, so they stay current.
    const lines = items.flatMap((item) => {
      const product = getProduct(item.slug);
      const colourway = product?.colourways.find((c) => c.id === item.colourwayId);
      if (!product || !colourway) return [];
      return [{ ...item, key: keyOf(item), product, colourway, unitPrice: effectivePrice(colourway) }];
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.unitPrice, 0),
      ready,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, ready, open, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
