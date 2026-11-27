"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string; // storage path
  option: string | null;
  qty: number;
  /** Set after re-checking with the server. */
  unavailable?: boolean;
  priceChanged?: boolean;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: string, option: string | null, qty: number) => void;
  remove: (productId: string, option: string | null) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "thanhchi-cart-v1";

const same = (l: CartLine, id: string, opt: string | null) => l.productId === id && l.option === opt;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* storage unavailable — cart just won't persist */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => same(l, line.productId, line.option));
      if (found) {
        return prev.map((l) =>
          same(l, line.productId, line.option) ? { ...l, ...line, qty: Math.min(99, l.qty + qty) } : l,
        );
      }
      return [...prev, { ...line, qty: Math.min(99, qty) }];
    });
  }, []);

  const setQty = useCallback((id: string, opt: string | null, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !same(l, id, opt))
        : prev.map((l) => (same(l, id, opt) ? { ...l, qty: Math.min(99, qty) } : l)),
    );
  }, []);

  const remove = useCallback((id: string, opt: string | null) => {
    setLines((prev) => prev.filter((l) => !same(l, id, opt)));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const replace = useCallback((next: CartLine[]) => setLines(next), []);

  const value = useMemo<CartCtx>(() => {
    const valid = lines.filter((l) => !l.unavailable);
    return {
      lines,
      ready,
      open,
      setOpen,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: valid.reduce((s, l) => s + l.price * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      replace,
    };
  }, [lines, ready, open, add, setQty, remove, clear, replace]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
