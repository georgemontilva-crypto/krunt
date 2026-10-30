import { flavorByKey, FLAVORS, RETAIL_MAX_QTY, type FlavorKey } from "@shared/const";
import { AnimatePresence, motion } from "motion/react";
import { Box, Check, FlaskConical, Hand, Minus, Plus, RotateCcw, ShoppingBag, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { ComingSoonModal, FlavorPicker, Reveal } from "@/components/Bits";
import { QtyStepper } from "@/components/Cart";
import { LazyViewer } from "@/components/LazyViewer";
import { formatMoney, useCatalog } from "@/lib/catalog";
import { packImage, useCart, useFlavor } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ViewerView } from "@/three/Viewer3D";
import NotFound from "./NotFound";

const VIEWS: Record<string, { v: ViewerView; label: string }[]> = {
  disposable: [
    { v: "pack", label: "Pouch" },
    { v: "device", label: "Device" },
  ],
  "preroll-pack": [
    { v: "pack", label: "Pouch" },
    { v: "cone", label: "Cones" },
  ],
  "preroll-tube": [
    { v: "pack", label: "Closed" },
    { v: "open", label: "Pop it" },
  ],
};

const FACTS: Record<string, string[]> = {
  disposable: ["Premium botanical blend", "Blue Lotus infused", "Pull-activated, no buttons", "Rechargeable", "Pesticide free", "Lab tested"],
  "preroll-pack": ["2 hand-finished cones", "Indoor grown", "Blue Lotus infused", "Branded crutch", "Pesticide free", "Lab tested"],
  "preroll-tube": ["1 premium cone", "Crush-proof tube", "Child-resistant cap", "Blue Lotus infused", "Pesticide free", "Lab tested"],
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useCatalog();
  const { flavor, setFlavor, color } = useFlavor();
  const cart = useCart();
  const [view, setView] = useState<ViewerView>("pack");
  const [turn, setTurn] = useState<{ angle: number; nonce: number }>();
  const [zoom, setZoom] = useState(1);
  const [soon, setSoon] = useState(false);
  const [hint, setHint] = useState(true);

  const product = data?.products.find(p => p.slug === slug);
  const step = data?.wholesale && product?.caseSize ? product.caseSize : 1;
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(step), [step]);
  useEffect(() => setView("pack"), [slug]);
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4500);
    return () => clearTimeout(t);
  }, []);

  const variant = product?.variants.find(v => v.flavorKey === flavor);
  const soldOut = useMemo(() => product?.variants.filter(v => !v.inStock).map(v => v.flavorKey) ?? [], [product]);
  const f = flavorByKey(flavor);

  if (!isLoading && !product) return <NotFound />;

  const unit = product ? (data?.wholesale && product.wholesalePriceCents != null ? product.wholesalePriceCents : product.retailPriceCents) : 0;
  const views = VIEWS[slug] ?? VIEWS.disposable;
  const doTurn = (angle: number) => setTurn({ angle, nonce: Date.now() });

  const addToCart = () => {
    if (!variant || !variant.inStock) return;
    cart.add(variant.id, qty);
    toast.success(`${qty} × ${f.name} ${product?.shortName} added`, {
      action: { label: "View cart", onClick: () => cart.setOpen(true) },
    });
  };

  return (
    <div className="bg-ink pb-28 md:pb-0">
      <section className="relative grid min-h-[100svh] md:grid-cols-[1.25fr_1fr]">
        {/* Stage */}
        <div className="wall grain relative h-[62svh] overflow-hidden md:sticky md:top-0 md:h-[100svh]" data-cursor="drag">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[90px] transition-colors duration-700" style={{ background: color }} />
          <AnimatePresence mode="wait">
            <motion.p
              key={flavor}
              aria-hidden
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="font-display pointer-events-none absolute inset-x-0 top-[18%] select-none whitespace-nowrap text-center text-[22vw] text-white/[0.05] md:text-[12vw]"
            >
              {f.name}
            </motion.p>
          </AnimatePresence>
          <LazyViewer slug={slug} flavor={flavor} color={color} view={view} turn={turn} zoom={zoom} mode="studio" className="absolute inset-0 pt-16" />

          <AnimatePresence>
            {hint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="label pointer-events-none absolute left-1/2 top-[22%] flex -translate-x-1/2 items-center gap-2 bg-black/70 px-3 py-2 text-[0.65rem] backdrop-blur"
              >
                <Hand className="h-4 w-4 animate-wobble" /> Drag to tilt
              </motion.div>
            )}
          </AnimatePresence>

          {/* Viewer controls */}
          <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-center justify-center gap-2 px-3 md:bottom-6">
            <div className="flex border-2 border-white/15 bg-black/70 p-1 backdrop-blur" role="tablist" aria-label="View">
              {views.map(v => (
                <button
                  key={v.v}
                  type="button"
                  role="tab"
                  aria-selected={view === v.v}
                  onClick={() => setView(v.v)}
                  className={cn("label relative px-3 py-2 text-[0.65rem]", view === v.v ? "text-black" : "text-paper")}
                >
                  {view === v.v && <motion.span layoutId="view-tab" className="absolute inset-0 bg-[var(--flavor)]" />}
                  <span className="relative flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5" /> {v.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex border-2 border-white/15 bg-black/70 p-1 backdrop-blur">
              <button type="button" onClick={() => setZoom(z => (z > 1 ? 1 : 1.45))} className="px-2.5 py-2 text-paper hover:text-[var(--flavor)]" aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}>
                {zoom > 1 ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => { setZoom(1); doTurn(0); }} className="px-2.5 py-2 text-paper hover:text-[var(--flavor)]" aria-label="Reset view">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div className="relative px-5 pb-16 pt-8 md:px-10 md:pt-32 lg:px-14">
          {product ? (
            <>
              <Link href="/products" className="label text-smoke hover:text-paper">← All products</Link>
              <p className="label mt-6 text-[var(--flavor)]">{product.shortName}</p>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={flavor}
                  initial={{ opacity: 0, x: -20, skewX: -8 }}
                  animate={{ opacity: 1, x: 0, skewX: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="font-display mt-1 text-[16vw] md:text-[5.5rem]"
                  style={{ color }}
                >
                  {f.name}
                </motion.h1>
              </AnimatePresence>
              <p className="mt-2 text-xl font-bold">{product.name}</p>
              <p className="mt-3 text-smoke">{f.notes}</p>

              <div className="mt-6 flex items-end gap-3">
                <span className="font-display text-6xl">{formatMoney(unit)}</span>
                <span className="label pb-2 text-smoke">{data?.wholesale ? `/ unit · case of ${step}` : "/ each"}</span>
              </div>
              {data?.wholesale ? (
                <p className="mt-1 text-sm text-[var(--flavor)]">Wholesale pricing active · case {formatMoney(unit * step)}</p>
              ) : (
                <p className="mt-1 text-sm text-smoke">
                  Buying for a store? <Link href="/wholesale" className="underline hover:text-paper">Get wholesale pricing</Link>
                </p>
              )}

              <div className="mt-8">
                <p className="label mb-3 text-smoke">Flavor</p>
                <FlavorPicker value={flavor} onChange={k => setFlavor(k as FlavorKey)} disabledKeys={soldOut} />
              </div>

              <div className="mt-8 hidden flex-wrap items-center gap-3 md:flex">
                <QtyStepper value={qty} step={step} max={data?.wholesale ? undefined : RETAIL_MAX_QTY} onChange={v => setQty(Math.max(step, v))} />
                <button type="button" onClick={addToCart} disabled={!variant?.inStock} className="btn btn-spray flex-1">
                  <ShoppingBag className="h-5 w-5" /> {variant?.inStock === false ? "Sold out" : `Add to cart · ${formatMoney(unit * qty)}`}
                </button>
              </div>

              <button type="button" onClick={() => setSoon(true)} className="mt-4 flex w-full items-center justify-between border-2 border-white/15 px-4 py-4 text-left transition hover:border-[var(--flavor)]">
                <span className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-[var(--flavor)]" />
                  <span className="label">Lab report · {f.name}</span>
                </span>
                <span className="label text-smoke">View →</span>
              </button>

              <div className="mt-10 border-t-2 border-white/10 pt-8">
                <p className="text-paper/90">{product.description}</p>
                <dl className="mt-6 grid grid-cols-2 gap-px bg-white/10">
                  <div className="bg-ink p-4">
                    <dt className="label text-smoke">Net wt.</dt>
                    <dd className="mt-1 font-bold">{product.netWeight}</dd>
                  </div>
                  <div className="bg-ink p-4">
                    <dt className="label text-smoke">Age</dt>
                    <dd className="mt-1 font-bold">21+ only</dd>
                  </div>
                </dl>
                <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
                  {(FACTS[product.slug] ?? []).map(x => (
                    <li key={x} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-[var(--flavor)]" strokeWidth={3} /> {x}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="h-96 animate-pulse bg-white/5" />
          )}
        </div>
      </section>

      {/* Same flavour, other formats */}
      {product && data && (
        <section className="border-t-2 border-white/10 px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <p className="label text-[var(--flavor)]">More {f.name}</p>
              <h2 className="font-display mt-2 text-6xl md:text-8xl">Other ways to get it</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {data.products
                .filter(p => p.slug !== product.slug)
                .map(p => (
                  <Link key={p.slug} href={`/products/${p.slug}`} className="group flex items-center gap-5 border-2 border-white/10 bg-wall p-5 transition hover:border-[var(--flavor)]">
                    <img src={packImage(p.slug, flavor)} alt="" loading="lazy" className="h-40 w-auto transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
                    <div>
                      <p className="font-display text-4xl">{p.shortName}</p>
                      <p className="text-smoke">{p.tagline}</p>
                      <p className="font-display mt-2 text-2xl text-[var(--flavor)]">
                        {formatMoney(data.wholesale && p.wholesalePriceCents != null ? p.wholesalePriceCents : p.retailPriceCents)}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
            <div className="mt-12 flex flex-wrap gap-2">
              {FLAVORS.map(fl => (
                <button key={fl.key} type="button" onClick={() => { setFlavor(fl.key); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="label border-2 px-3 py-2 text-[0.65rem] transition hover:text-black" style={{ borderColor: fl.color }} onMouseEnter={e => (e.currentTarget.style.background = fl.color)} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  {fl.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile buy bar */}
      {product && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t-2 border-[var(--flavor)] bg-black/90 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="inline-flex items-center border-2 border-white/20">
            <button type="button" className="flex h-12 w-10 items-center justify-center" onClick={() => setQty(q => Math.max(step, q - step))} aria-label="Less">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-black tabular-nums">{qty}</span>
            <button type="button" className="flex h-12 w-10 items-center justify-center" onClick={() => setQty(q => (data?.wholesale ? q + step : Math.min(RETAIL_MAX_QTY, q + 1)))} aria-label="More">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={addToCart} disabled={!variant?.inStock} className="btn btn-spray min-h-12 flex-1 px-3 text-sm">
            {variant?.inStock === false ? "Sold out" : `Add · ${formatMoney(unit * qty)}`}
          </button>
        </div>
      )}
      <ComingSoonModal open={soon} onClose={() => setSoon(false)} />
    </div>
  );
}
