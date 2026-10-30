import { FLAVORS, flavorByKey, type FlavorKey } from "@shared/const";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* ─── Media paths ────────────────────────────────────────────────────────── */

export const packImage = (slug: string, flavor: string) => `/packs/${slug}/${flavor}.webp`;
export const tex = (slug: string, flavor: string, part: "front" | "back" | "wrap") =>
  `/tex/${slug}-${flavor}-${part}.webp`;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: state just won't persist */
  }
}

/* ─── Flavour: the whole site wears the colour of the selected pack ─────── */

type FlavorCtx = { flavor: FlavorKey; setFlavor: (f: FlavorKey) => void; color: string };
const FlavorContext = createContext<FlavorCtx | null>(null);

export function FlavorProvider({ children }: { children: ReactNode }) {
  const [flavor, setFlavorState] = useState<FlavorKey>(() => {
    const stored = readStorage<string>("krunkd_flavor", "");
    return FLAVORS.some(f => f.key === stored) ? (stored as FlavorKey) : "candy-gas";
  });
  const color = flavorByKey(flavor).color;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--flavor", color);
    root.style.setProperty("--flavor-rgb", hexToRgb(color));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0a0a0a");
  }, [color]);

  const setFlavor = useCallback((f: FlavorKey) => {
    setFlavorState(f);
    writeStorage("krunkd_flavor", f);
  }, []);

  const value = useMemo(() => ({ flavor, setFlavor, color }), [flavor, setFlavor, color]);
  return <FlavorContext.Provider value={value}>{children}</FlavorContext.Provider>;
}

export function useFlavor() {
  const ctx = useContext(FlavorContext);
  if (!ctx) throw new Error("useFlavor outside FlavorProvider");
  return ctx;
}

/* ─── Cart ───────────────────────────────────────────────────────────────── */

export type CartLine = { variantId: number; quantity: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (variantId: number, qty: number) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
};
const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readStorage<CartLine[]>("krunkd_cart", []));
  const [open, setOpen] = useState(false);

  useEffect(() => writeStorage("krunkd_cart", lines), [lines]);

  const add = useCallback((variantId: number, qty: number) => {
    setLines(prev => {
      const hit = prev.find(l => l.variantId === variantId);
      return hit
        ? prev.map(l => (l.variantId === variantId ? { ...l, quantity: l.quantity + qty } : l))
        : [...prev, { variantId, quantity: qty }];
    });
  }, []);
  const setQty = useCallback((variantId: number, qty: number) => {
    setLines(prev =>
      qty <= 0 ? prev.filter(l => l.variantId !== variantId) : prev.map(l => (l.variantId === variantId ? { ...l, quantity: qty } : l))
    );
  }, []);
  const remove = useCallback((variantId: number) => setLines(prev => prev.filter(l => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((s, l) => s + l.quantity, 0), open, setOpen, add, setQty, remove, clear }),
    [lines, open, add, setQty, remove, clear]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
