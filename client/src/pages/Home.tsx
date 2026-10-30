import { FLAVORS, flavorByKey, type FlavorKey, type ProductKind } from "@shared/const";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, BadgeCheck, FlaskConical, Leaf, ShieldCheck, Sparkles, SprayCan, Sprout } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { Drips, Mark, Splat } from "@/components/Brand";
import { ComingSoonModal, FlavorPicker, Reveal, SlamText, TiltCard } from "@/components/Bits";
import { LazyViewer } from "@/components/LazyViewer";
import { SprayCanvas } from "@/components/SprayCanvas";
import { Tape } from "@/components/Tape";
import { formatMoney, useCatalog } from "@/lib/catalog";
import { packImage, useFlavor } from "@/lib/store";
import { cn } from "@/lib/utils";

const LINES: { slug: ProductKind; label: string }[] = [
  { slug: "disposable", label: "Disposable" },
  { slug: "preroll-pack", label: "2 Pack" },
  { slug: "preroll-tube", label: "Tube" },
];

/* ─── Hero: the wall ─────────────────────────────────────────────────────── */

function Sticker({ children, className, rotate = 0 }: { children: React.ReactNode; className?: string; rotate?: number }) {
  return (
    <motion.div
      drag
      dragMomentum
      dragElastic={0.2}
      whileDrag={{ scale: 1.12, rotate: rotate + 8, zIndex: 30 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, rotate: rotate - 40 }}
      animate={{ scale: 1, rotate }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.8 }}
      data-no-spray
      className={cn("sticker absolute z-20 flex touch-none select-none items-center justify-center rounded-full text-center", className)}
      data-cursor="link"
    >
      {children}
    </motion.div>
  );
}

function Hero() {
  const { flavor, setFlavor, color } = useFlavor();
  const [line, setLine] = useState<ProductKind>("disposable");
  const [armed, setArmed] = useState(false);
  const [splash, setSplash] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const f = flavorByKey(flavor);

  const pick = (k: FlavorKey, e?: React.MouseEvent) => {
    if (k === flavor) return;
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;
    setSplash({ x, y, color: flavorByKey(k).color, id: Date.now() });
    setTimeout(() => setFlavor(k), 180);
  };

  return (
    <section className="wall grain relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24" data-cursor="spray">
      {/* Flavour-change paint splash */}
      <AnimatePresence>
        {splash && (
          <motion.div
            key={splash.id}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[60]"
            style={{ background: splash.color }}
            initial={{ clipPath: `circle(0px at ${splash.x}px ${splash.y}px)`, opacity: 1 }}
            animate={{ clipPath: `circle(160% at ${splash.x}px ${splash.y}px)`, opacity: [1, 1, 0] }}
            transition={{ duration: 0.75, ease: [0.6, 0, 0.2, 1], opacity: { times: [0, 0.45, 1], duration: 0.75 } }}
            onAnimationComplete={() => setSplash(null)}
          />
        )}
      </AnimatePresence>

      <SprayCanvas color={color} armed={armed} className="absolute inset-0 z-[1] h-full w-full" />

      {/* Huge drippy backdrop word */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[22%] z-0 select-none text-center md:top-[16%]">
        <motion.p
          key={flavor}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="whitespace-nowrap font-[family-name:var(--font-drip)] text-[21vw] leading-none md:text-[22vw]"
          style={{ color, opacity: 0.9, textShadow: `0 0 80px ${color}55` }}
        >
          KRUNK'D
        </motion.p>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 opacity-60" style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }} />

      {/* Stickers you can peel and throw around */}
      <Sticker className="left-[5%] top-[22%] h-20 w-20 bg-blood text-white md:left-[8%] md:h-28 md:w-28" rotate={-12}>
        <span className="font-display text-3xl md:text-5xl">21+</span>
      </Sticker>
      <Sticker className="right-[4%] top-[18%] hidden h-32 w-32 bg-[#1fb4ff] text-black md:flex" rotate={10}>
        <span className="label leading-tight">Blue<br />Lotus<br />Infused</span>
      </Sticker>
      <Sticker className="bottom-[30%] right-[6%] h-20 w-20 bg-paper text-black md:bottom-[22%] md:right-[10%] md:h-28 md:w-28" rotate={-6}>
        <span className="label leading-tight">Lab<br />Tested</span>
      </Sticker>

      {/* Product in 3D */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4">
        <div className="pointer-events-auto relative h-[50svh] w-full max-w-[560px] md:h-[54svh]">
          <LazyViewer slug={line} flavor={flavor} color={color} mode="hero" className="h-full w-full" />
        </div>

        {/* Line switch */}
        <div className="relative -mt-4 flex gap-1 border-2 border-white/15 bg-black/60 p-1 backdrop-blur" role="tablist" aria-label="Product">
          {LINES.map(l => (
            <button
              key={l.slug}
              role="tab"
              aria-selected={line === l.slug}
              onClick={() => setLine(l.slug)}
              className={cn("label relative px-3 py-2.5 text-[0.68rem] transition-colors md:px-5", line === l.slug ? "text-black" : "text-paper")}
            >
              {line === l.slug && <motion.span layoutId="hero-line" className="absolute inset-0 bg-[var(--flavor)]" />}
              <span className="relative">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom bar: headline, flavours, CTAs */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-4 md:px-8">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="label flex items-center gap-2 text-[var(--flavor)]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--flavor)]" /> Now pouring: {f.name}
            </p>
            <h1 className="font-display mt-2 text-[13vw] md:text-[5.6rem]">
              Six flavors.
              <br />
              <span className="text-outline text-[var(--flavor)]">Zero chill.</span>
            </h1>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <div className="flex w-max gap-2 md:w-auto">
                {FLAVORS.map(fl => (
                  <button
                    key={fl.key}
                    type="button"
                    onClick={e => pick(fl.key, e)}
                    aria-label={fl.name}
                    aria-pressed={fl.key === flavor}
                    className={cn(
                      "group relative h-12 w-12 shrink-0 rounded-full border-[3px] transition-transform hover:-translate-y-1",
                      fl.key === flavor ? "scale-110 border-white" : "border-black"
                    )}
                    style={{ background: fl.color }}
                  >
                    <span className="label pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 text-[0.6rem] text-white group-hover:block">
                      {fl.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/products/${line}`} className="btn btn-spray">
                Shop {LINES.find(l => l.slug === line)?.label} <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setArmed(a => !a)}
                className={cn("btn md:hidden", armed ? "btn-spray" : "btn-ghost")}
                aria-pressed={armed}
              >
                <SprayCan className="h-5 w-5" /> {armed ? "Tagging…" : "Tag the wall"}
              </button>
            </div>
          </div>
        </div>
        <p className="label mt-5 hidden items-center gap-2 text-smoke md:flex">
          <SprayCan className="h-4 w-4" /> Click & hold anywhere on the wall to spray · drag the stickers · pick a color
        </p>
      </div>
      <a href="#lineup" className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce text-smoke md:block" aria-label="Scroll down">
        <ArrowDown className="h-6 w-6" />
      </a>
    </section>
  );
}

/* ─── Line-up ────────────────────────────────────────────────────────────── */

function Lineup() {
  const { flavor } = useFlavor();
  const { data } = useCatalog();
  const f = flavorByKey(flavor);
  return (
    <section id="lineup" className="relative overflow-hidden bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="label text-[var(--flavor)]">The line-up</p>
          <h2 className="font-display mt-2 text-[15vw] md:text-[8rem]">
            <SlamText text="Pick your" /> <span className="text-[var(--flavor)]"><SlamText text="poison" /></span>
          </h2>
        </Reveal>
      </div>
      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 md:mx-auto md:grid md:max-w-7xl md:grid-cols-3 md:gap-8 md:overflow-visible md:px-8">
        {LINES.map((l, i) => {
          const p = data?.products.find(x => x.slug === l.slug);
          return (
            <Reveal key={l.slug} delay={i * 0.1} className="w-[78vw] shrink-0 snap-center md:w-auto">
              <Link href={`/products/${l.slug}`} className="group block">
                <TiltCard className="overflow-hidden border-4 border-white/10 bg-wall transition-colors group-hover:border-[var(--flavor)]">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden">
                    <Splat seed={i + 2} className="absolute h-[85%] w-[85%] text-[var(--flavor)] opacity-25 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90" />
                    <span className="font-display absolute left-4 top-3 text-7xl text-white/10">0{i + 1}</span>
                    <motion.img
                      key={flavor}
                      initial={{ y: 30, opacity: 0, rotate: -6 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      src={packImage(l.slug, flavor)}
                      alt={`Krunk'd ${l.label} ${f.name}`}
                      loading="lazy"
                      className="relative h-[82%] w-auto object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,.7)] transition-transform duration-500 [transform:translateZ(60px)] group-hover:-translate-y-3 group-hover:rotate-[-4deg] group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-3 border-t-4 border-white/10 p-5">
                    <div>
                      <h3 className="font-display text-4xl">{p?.shortName ?? l.label}</h3>
                      <p className="mt-1 text-sm text-smoke">{p?.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="label text-smoke">{data?.wholesale ? "Wholesale" : "From"}</p>
                      <p className="font-display text-3xl text-[var(--flavor)]">
                        {p ? formatMoney(data?.wholesale && p.wholesalePriceCents != null ? p.wholesalePriceCents : p.retailPriceCents) : "—"}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Flavour wall ───────────────────────────────────────────────────────── */

function FlavorWall() {
  const { flavor, setFlavor } = useFlavor();
  const [open, setOpen] = useState<FlavorKey>(flavor);
  return (
    <section className="relative bg-black py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-[var(--flavor)]">The flavor wall</p>
            <h2 className="font-display mt-2 text-[13vw] md:text-[7rem]">Six ways to lose it</h2>
          </div>
          <p className="max-w-xs text-smoke">Every flavor comes as a disposable, a 2 pack and a tube. Tap one to crack it open.</p>
        </Reveal>
      </div>
      <ul className="mt-12 border-t-2 border-white/10">
        {FLAVORS.map((fl, i) => {
          const isOpen = open === fl.key;
          return (
            <li key={fl.key} className="relative overflow-hidden border-b-2 border-white/10">
              <motion.div
                aria-hidden
                className="absolute inset-0 origin-left"
                style={{ background: fl.color }}
                initial={false}
                animate={{ scaleX: isOpen ? 1 : 0 }}
                transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(fl.key);
                  setFlavor(fl.key);
                }}
                onMouseEnter={() => window.matchMedia("(pointer: fine)").matches && setOpen(fl.key)}
                aria-expanded={isOpen}
                className={cn("relative mx-auto flex w-full max-w-7xl items-center gap-4 px-5 py-4 text-left md:px-8 md:py-5", isOpen ? "text-black" : "text-paper")}
              >
                <span className="label w-8 shrink-0 opacity-60">0{i + 1}</span>
                <span className="font-display flex-1 text-[11vw] transition-transform duration-300 md:text-[6.5rem]" style={{ color: isOpen ? "#000" : undefined }}>
                  {fl.name}
                </span>
                <span className="h-6 w-6 shrink-0 rounded-full border-[3px] border-current" style={{ background: fl.color }} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
                    className="relative overflow-hidden text-black"
                  >
                    <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-8 md:grid-cols-[1fr_1.4fr] md:px-8">
                      <div>
                        <p className="text-lg font-semibold md:text-xl">{fl.notes}</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          {LINES.map(l => (
                            <Link key={l.slug} href={`/products/${l.slug}`} onClick={() => setFlavor(fl.key)} className="btn btn-ink">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="flex h-56 items-end justify-center gap-2 md:h-72 md:gap-6">
                        {LINES.map((l, j) => (
                          <motion.img
                            key={l.slug}
                            src={packImage(l.slug, fl.key)}
                            alt={`${fl.name} ${l.label}`}
                            loading="lazy"
                            initial={{ y: 120, rotate: (j - 1) * 14 }}
                            animate={{ y: 0, rotate: (j - 1) * 6 }}
                            transition={{ delay: 0.1 + j * 0.07, type: "spring", stiffness: 200, damping: 16 }}
                            className="h-full w-auto object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,.45)]"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Pop the top: scroll-driven tube ────────────────────────────────────── */

const STEPS = [
  { k: "01", t: "Crush-proof", d: "A child-resistant tube that survives your pocket, your bag and your bad decisions." },
  { k: "02", t: "Pop the top", d: "Twist, lift, done. Smell-proof seal until the moment you crack it." },
  { k: "03", t: "1.5 g of loud", d: "One hand-finished premium botanical cone, Blue Lotus infused, branded crutch." },
];

function PopTheTop() {
  const ref = useRef<HTMLDivElement>(null);
  const { flavor, color } = useFlavor();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", v => setStep(v < 0.33 ? 0 : v < 0.66 ? 1 : 2));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative h-[280vh] bg-ink">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden md:flex-row">
        <div className="pointer-events-none absolute inset-0 halftone text-white/[0.04]" />
        <div className="relative z-10 flex flex-col justify-end px-5 pb-6 pt-24 md:w-1/2 md:justify-center md:px-16 md:pb-0">
          <p className="label text-[var(--flavor)]">Pre-roll tube</p>
          <div className="relative mt-2 h-[9.5rem] md:h-[18rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ y: 40, opacity: 0, rotate: -2 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <p className="font-display text-xl text-[var(--flavor)]">{STEPS[step].k}</p>
                <h2 className="font-display text-[14vw] md:text-[7rem]">{STEPS[step].t}</h2>
                <p className="mt-2 max-w-md text-smoke md:text-lg">{STEPS[step].d}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 h-1.5 w-full max-w-md bg-white/10">
            <motion.div className="h-full bg-[var(--flavor)]" style={{ width: bar }} />
          </div>
        </div>
        <div className="relative flex-1 md:w-1/2">
          <LazyViewer slug="preroll-tube" flavor={flavor} color={color} view={step >= 1 ? "open" : "pack"} mode="hero" className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
}

/* ─── Why ────────────────────────────────────────────────────────────────── */

function Why() {
  const [soon, setSoon] = useState(false);
  const items = [
    { icon: Sprout, t: "Indoor grown", d: "Botanicals raised under lights, not luck." },
    { icon: Leaf, t: "Pesticide free", d: "Nothing on it you'd need to Google." },
    { icon: Sparkles, t: "Blue Lotus infused", d: "Every pack. Every pull." },
    { icon: ShieldCheck, t: "Premium quality", d: "Hand-checked, sealed, smell-proof." },
    { icon: FlaskConical, t: "Lab tested", d: "Third-party tested, batch by batch.", action: () => setSoon(true) },
    { icon: BadgeCheck, t: "21+ only", d: "Grown folks only. We check." },
  ];
  return (
    <section className="paper torn-top relative -mt-6 overflow-hidden py-24 md:py-32">
      <Mark className="pointer-events-none absolute -right-24 -top-10 w-[420px] rotate-12 opacity-[0.07] grayscale" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="label">Why Krunk'd</p>
          <h2 className="font-display mt-2 text-[13vw] md:text-[7.5rem]">
            Loud pack.
            <br />
            Clean inside.
          </h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={(i % 3) * 0.08}>
              <motion.button
                type="button"
                onClick={it.action}
                whileHover={{ rotate: i % 2 ? 2 : -2, y: -6 }}
                className={cn("group relative block h-full w-full border-[3px] border-black bg-white p-5 text-left shadow-[6px_6px_0_#000] md:p-7", !it.action && "cursor-default")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-[var(--flavor)]">
                  <it.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display mt-4 text-3xl md:text-4xl">{it.t}</h3>
                <p className="mt-1 text-sm text-black/60 md:text-base">{it.d}</p>
                {it.action && <span className="label mt-3 inline-block border-b-2 border-black">View lab report →</span>}
              </motion.button>
            </Reveal>
          ))}
        </div>
      </div>
      <ComingSoonModal open={soon} onClose={() => setSoon(false)} />
    </section>
  );
}

/* ─── Wholesale CTA ──────────────────────────────────────────────────────── */

function WholesaleBand() {
  return (
    <section className="relative overflow-hidden bg-[var(--flavor)] text-black transition-colors duration-700">
      <div className="text-black">
        <Drips className="h-14" count={14} seed={11} />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-6 md:grid-cols-[1.3fr_1fr] md:px-8 md:pb-28">
        <div>
          <p className="label">Retailers, smoke shops, distributors</p>
          <h2 className="font-display mt-3 text-[13vw] md:text-[7rem]">
            Stock the loudest pack on the shelf.
          </h2>
          <p className="mt-5 max-w-lg text-lg font-semibold">
            Open a wholesale account, get approved, and order by the case at wholesale pricing. Display-ready packs in all six flavors.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wholesale" className="btn btn-ink">
              Apply for wholesale <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="btn border-black bg-transparent text-black hover:bg-black hover:text-[var(--flavor)]">
              Talk to sales
            </Link>
          </div>
        </div>
        <div className="relative mx-auto flex h-80 w-full max-w-sm items-end justify-center md:h-[26rem]">
          {FLAVORS.slice(0, 5).map((fl, i) => (
            <motion.img
              key={fl.key}
              src={packImage("disposable", fl.key)}
              alt=""
              loading="lazy"
              className="absolute bottom-0 h-[85%] w-auto drop-shadow-[0_20px_25px_rgba(0,0,0,.4)]"
              style={{ zIndex: 5 - Math.abs(i - 2) }}
              initial={{ x: 0, rotate: 0 }}
              whileInView={{ x: (i - 2) * 58, rotate: (i - 2) * 9, y: Math.abs(i - 2) * 14 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <div className="relative z-10 -my-8 h-28 bg-ink">
        <Tape tilt={-3} className="absolute inset-x-0 top-2" />
        <Tape tilt={2} reverse className="absolute inset-x-0 top-6 opacity-90" words={["Bacio Gelato", "Big Nasty", "Blue Skittles", "Candy Gas", "King Louis", "Paris OG"]} />
      </div>
      <Lineup />
      <FlavorWall />
      <PopTheTop />
      <Why />
      <WholesaleBand />
    </>
  );
}
