import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "wouter";
import { Drips, Mark } from "@/components/Brand";
import { PageHead, Reveal } from "@/components/Bits";
import { Tape } from "@/components/Tape";
import { packImage } from "@/lib/store";

const MANIFESTO =
  "We got tired of botanicals that looked like vitamins and hit like decaf. So we made Krunk'd: premium botanical blends, Blue Lotus infused, wrapped in packs that look like the side of a subway car. Loud outside. Clean inside. No apologies.";

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const color = useTransform(progress, [range[0], range[1]], ["#f1efe6", "var(--flavor)"]);
  return (
    <motion.span style={{ opacity, color: word.includes("Krunk") ? color : undefined }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

/** Each word lights up as it scrolls past. */
function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = MANIFESTO.split(" ");
  return (
    <section className="bg-ink px-5 py-24 md:px-8 md:py-36">
      <div ref={ref} className="mx-auto max-w-6xl">
        <p className="label mb-6 text-[var(--flavor)]">The manifesto</p>
        <p className="font-display text-[9vw] leading-[0.95] md:text-[5.2rem]">
          {words.map((w, i) => (
            <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          ))}
        </p>
      </div>
    </section>
  );
}

function Bunny() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rot = useTransform(scrollYProgress, [0, 1], [-25, 25]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.05, 0.9]);
  return (
    <section ref={ref} className="wall grain relative overflow-hidden px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
        <motion.div style={{ rotate: rot, scale }} className="relative mx-auto w-64 md:w-96">
          <div className="absolute inset-0 glow opacity-50" />
          <Mark className="relative w-full drop-shadow-[0_0_40px_rgba(0,0,0,.8)]" />
        </motion.div>
        <div>
          <p className="label text-[var(--flavor)]">Meet the bunny</p>
          <h2 className="font-display mt-2 text-[14vw] md:text-[7rem]">X eyes. Big grin.</h2>
          <p className="mt-5 max-w-lg text-lg text-smoke">
            That's the face. The one you make when the session hits right. Sprayed, dripping, a little unhinged and always smiling: our bunny is
            the whole brand in one tag. If you see it on a wall, a pouch or a tube, you know what's inside.
          </p>
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { t: "Loud by design", d: "Every pack is street art. Six colorways, one bunny, zero beige." },
  { t: "Clean by default", d: "Indoor-grown, pesticide-free botanicals, Blue Lotus infused, tested batch by batch." },
  { t: "Built for the shelf", d: "Display-ready packaging and case pricing that makes shop owners happy." },
  { t: "Grown folks only", d: "21+ means 21+. On the site, on the pack, at the counter." },
];

export default function About() {
  return (
    <>
      <PageHead kicker="About us" title="Born loud">
        <p className="mt-6 max-w-xl text-lg text-smoke">
          Krunk'd is a premium botanical brand for people who like their sessions the way they like their music: turned all the way up.
        </p>
      </PageHead>
      <Tape tilt={2} />
      <Manifesto />
      <Bunny />
      <section className="paper torn-top relative -mt-6 px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="label">What we stand for</p>
            <h2 className="font-display mt-2 text-[13vw] md:text-[7rem]">House rules</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 0.06}>
                <div className="relative h-full border-[3px] border-black bg-white p-7 shadow-[6px_6px_0_#000]">
                  <span className="font-display absolute right-5 top-3 text-6xl text-black/10">0{i + 1}</span>
                  <h3 className="font-display text-4xl md:text-5xl">{v.t}</h3>
                  <p className="mt-2 text-black/70 md:text-lg">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-[var(--flavor)] text-black">
        <Drips className="h-12" count={12} seed={5} />
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 pb-20 pt-4 text-center md:px-8">
          <div className="flex h-56 items-end justify-center gap-3">
            {(["disposable", "preroll-pack", "preroll-tube"] as const).map((s, i) => (
              <motion.img
                key={s}
                src={packImage(s, ["big-nasty", "blue-skittles", "king-louis"][i])}
                alt=""
                loading="lazy"
                className="h-full w-auto drop-shadow-[0_20px_20px_rgba(0,0,0,.4)]"
                initial={{ y: 80, rotate: 0 }}
                whileInView={{ y: 0, rotate: (i - 1) * 8 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 160, damping: 14, delay: i * 0.08 }}
              />
            ))}
          </div>
          <h2 className="font-display text-[13vw] md:text-[6.5rem]">Enough reading.</h2>
          <Link href="/products" className="btn btn-ink">
            Shop Krunk'd <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
