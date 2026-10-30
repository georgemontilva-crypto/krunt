import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { formatMoney, resolveCart, useCatalog } from "@/lib/catalog";
import { packImage, useCart } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RETAIL_MAX_QTY } from "@shared/const";

export function QtyStepper({
  value,
  onChange,
  step = 1,
  max,
  small,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  max?: number;
  small?: boolean;
}) {
  const h = small ? "h-9 w-9" : "h-12 w-12";
  return (
    <div className="inline-flex items-stretch border-2 border-paper/30">
      <button type="button" className={cn(h, "flex items-center justify-center hover:bg-white/10")} onClick={() => onChange(Math.max(0, value - step))} aria-label="Less">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn("flex min-w-12 items-center justify-center px-2 font-black tabular-nums", small ? "text-sm" : "text-lg")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn(h, "flex items-center justify-center hover:bg-white/10 disabled:opacity-30")}
        onClick={() => onChange(max ? Math.min(max, value + step) : value + step)}
        disabled={max != null && value >= max}
        aria-label="More"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const [, nav] = useLocation();
  const { data } = useCatalog();
  const { items, subtotal, problems } = resolveCart(cart.lines, data);

  useEffect(() => {
    if (!cart.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cart.setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [cart.open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {cart.open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            className="wall fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col border-l-4 border-[var(--flavor)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-display text-4xl">Your stash</h2>
                {data?.wholesale && <p className="label text-[var(--flavor)]">Wholesale pricing</p>}
              </div>
              <button type="button" onClick={() => cart.setOpen(false)} className="flex h-11 w-11 items-center justify-center border-2 border-paper/30" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-display text-5xl text-white/20">Empty.</p>
                  <p className="mt-2 text-smoke">Nothing here yet. Fix that.</p>
                  <button
                    type="button"
                    className="btn btn-spray mt-6"
                    onClick={() => {
                      cart.setOpen(false);
                      nav("/products");
                    }}
                  >
                    Shop now
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map(i => (
                    <motion.li layout key={i.variant.id} className="flex gap-4 border-b border-white/10 pb-4">
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center" style={{ background: `radial-gradient(circle, ${i.flavor.color}55, transparent 70%)` }}>
                        <img src={packImage(i.product.slug, i.flavor.key)} alt="" className="h-full w-auto object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xl leading-none" style={{ color: i.flavor.color }}>{i.flavor.name}</p>
                        <p className="mt-1 text-sm text-smoke">{i.product.shortName}</p>
                        <p className="mt-1 text-sm">
                          {formatMoney(i.unit)} {i.step > 1 && <span className="text-smoke">· case of {i.step}</span>}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <QtyStepper small value={i.line.quantity} step={i.step} max={data?.wholesale ? undefined : RETAIL_MAX_QTY} onChange={v => cart.setQty(i.variant.id, v)} />
                          <button type="button" onClick={() => cart.remove(i.variant.id)} className="p-2 text-smoke hover:text-blood" aria-label="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="font-black tabular-nums">{formatMoney(i.total)}</p>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/10 px-5 py-5">
                {problems.length > 0 && (
                  <ul className="mb-3 space-y-1 text-sm text-blood">
                    {problems.map(p => <li key={p}>• {p}</li>)}
                  </ul>
                )}
                <div className="flex items-end justify-between">
                  <span className="label text-smoke">Subtotal</span>
                  <span className="font-display text-4xl">{formatMoney(subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-smoke">Shipping calculated at checkout. No payment is taken online yet.</p>
                <Link
                  href="/checkout"
                  onClick={() => cart.setOpen(false)}
                  className={cn("btn btn-spray mt-4 w-full", problems.length && "pointer-events-none opacity-50")}
                >
                  Checkout →
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
