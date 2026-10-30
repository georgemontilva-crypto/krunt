import { FLAVORS } from "@shared/const";
import { motion } from "motion/react";
import { FlaskConical, Lock } from "lucide-react";
import { Link } from "wouter";
import { Mark } from "@/components/Brand";
import { Tape } from "@/components/Tape";

/** Lab reports aren't published yet: the whole page is a "coming soon". */
export default function LabReports() {
  return (
    <>
      <section className="wall grain relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-32 md:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--flavor)] opacity-25 blur-[120px]" />
        {/* Bubbles rising out of the flask */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute bottom-0 rounded-full border-2"
            style={{ left: `${(i * 7.3) % 100}%`, width: 10 + (i % 4) * 8, height: 10 + (i % 4) * 8, borderColor: FLAVORS[i % 6].color }}
            animate={{ y: [0, -900], opacity: [0, 1, 0] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <div className="relative mx-auto w-full max-w-5xl text-center">
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 12 }} className="relative mx-auto w-36 md:w-44">
            <Mark className="w-full" />
            <motion.div animate={{ rotate: [0, 14, -10, 0] }} transition={{ duration: 2.2, repeat: Infinity }} className="absolute -bottom-3 -right-8">
              <FlaskConical className="h-16 w-16 text-[var(--flavor)] md:h-20 md:w-20" strokeWidth={2.4} />
            </motion.div>
          </motion.div>
          <p className="label mt-10 text-[var(--flavor)]">Lab reports</p>
          <h1 className="font-display mt-3 animate-flicker text-[19vw] spray-glow md:text-[11rem]">Coming soon</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-smoke">
            Every Krunk'd batch is third-party lab tested. The certificates of analysis for all six flavors are getting their final stamp and will
            live right here.
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
            {FLAVORS.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="flex items-center justify-between border-2 bg-black/50 px-4 py-3 backdrop-blur"
                style={{ borderColor: f.color }}
              >
                <span className="label text-left text-[0.65rem]">{f.name}</span>
                <Lock className="h-4 w-4" style={{ color: f.color }} />
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-spray">Request a COA</Link>
            <Link href="/products" className="btn btn-ghost">Back to the goods</Link>
          </div>
        </div>
      </section>
      <Tape tilt={-2} words={["Lab tested", "Coming soon", "Lab tested", "Coming soon"]} />
    </>
  );
}
