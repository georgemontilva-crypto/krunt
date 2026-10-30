import { FLAVORS, type FlavorKey } from "@shared/const";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { FlaskConical, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Mark } from "./Brand";

/** Fades and lifts children in as they scroll into view. */
export function Reveal({ children, delay = 0, className, y = 40 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that slams in letter by letter, like stencil hits. */
export function SlamText({ text, className }: { text: string; className?: string }) {
  let n = 0;
  return (
    <span className={cn("inline", className)} aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden>
          {word.split("").map((ch, i) => {
            const d = n++;
            return (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, scale: 2.2, rotate: (d % 2 ? 1 : -1) * 12 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: d * 0.035, type: "spring", stiffness: 500, damping: 18 }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      )).flatMap((el, i, arr) => (i < arr.length - 1 ? [el, " "] : [el]))}
    </span>
  );
}

/** Six flavour swatches as spray caps. */
export function FlavorPicker({
  value,
  onChange,
  className,
  size = "md",
  disabledKeys = [],
}: {
  value: FlavorKey;
  onChange: (f: FlavorKey) => void;
  className?: string;
  size?: "sm" | "md";
  disabledKeys?: string[];
}) {
  return (
    <div role="radiogroup" aria-label="Flavor" className={cn("flex flex-wrap gap-2", className)}>
      {FLAVORS.map(f => {
        const active = f.key === value;
        const out = disabledKeys.includes(f.key);
        return (
          <button
            key={f.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(f.key)}
            className={cn(
              "group relative flex items-center gap-2 border-2 transition-all",
              size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2",
              active ? "border-transparent text-black" : "border-white/15 text-paper hover:border-white/50"
            )}
            style={active ? { background: f.color } : undefined}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-black/60" style={{ background: f.color }} />
            <span className={cn("label whitespace-nowrap", size === "sm" ? "text-[0.62rem]" : "text-[0.7rem]", out && "line-through opacity-60")}>{f.name}</span>
            {active && <motion.span layoutId={`flavor-active-${size}`} className="absolute -inset-[5px] border-2 border-white/80" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
          </button>
        );
      })}
    </div>
  );
}

/** Card that tilts toward the pointer, with a glare. Static on touch. */
export function TiltCard({ children, className, glare = true }: { children: ReactNode; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 18 });
  const gx = useTransform(mx, v => `${v * 100}%`);
  const gy = useTransform(my, v => `${v * 100}%`);
  const bg = useTransform([gx, gy] as never, ([x, y]: string[]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.22), transparent 45%)`);

  return (
    <motion.div
      ref={ref}
      className={cn("relative [transform-style:preserve-3d]", className)}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={e => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      {children}
      {glare && <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: bg }} />}
    </motion.div>
  );
}

/** "Lab reports are on the way" — shown wherever a lab report link is clicked. */
export function ComingSoonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="soon-title"
        >
          <motion.div
            className="wall relative w-full max-w-md border-4 border-[var(--flavor)] p-8 text-center"
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.6, rotate: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            onClick={e => e.stopPropagation()}
          >
            <button type="button" onClick={onClose} className="absolute right-3 top-3 p-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <div className="relative mx-auto w-28">
              <Mark className="w-28" />
              <FlaskConical className="absolute -bottom-2 -right-4 h-12 w-12 rotate-12 text-[var(--flavor)]" strokeWidth={2.5} />
            </div>
            <p className="label mt-6 text-[var(--flavor)]">Lab reports</p>
            <h2 id="soon-title" className="font-display mt-1 animate-flicker text-6xl spray-glow">Coming soon</h2>
            <p className="mt-3 text-smoke">Every batch is lab tested. The certificates are getting their final stamp and will be posted here.</p>
            <Link href="/contact" onClick={onClose} className="btn btn-spray mt-6">
              Need one now? Ask us
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <section className="wall grain relative overflow-hidden px-5 pb-14 pt-36 md:px-8 md:pb-20 md:pt-44">
      <div className="pointer-events-none absolute -right-20 top-10 h-96 w-96 rounded-full bg-[var(--flavor)] opacity-20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="label text-[var(--flavor)]">{kicker}</p>
        <h1 className="font-display mt-3 text-[16vw] md:text-[9rem]">
          <SlamText text={title} />
        </h1>
        {children}
      </div>
    </section>
  );
}
