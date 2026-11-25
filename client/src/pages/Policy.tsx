import { POLICIES } from "@shared/policies";
import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import { Link, useParams } from "wouter";
import { Tape } from "@/components/Tape";
import { cn } from "@/lib/utils";
import NotFound from "./NotFound";

/** Turns email addresses and the site's own policy names into links. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\S+@\S+\.[a-z]{2,}|Shipping Policy|Returns & Refunds Policy)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\S+@\S+\.[a-z]{2,}$/.test(part)) {
          return (
            <a key={i} href={`mailto:${part}`} className="font-semibold underline decoration-[var(--flavor)] decoration-[3px] underline-offset-2">
              {part}
            </a>
          );
        }
        if (part === "Shipping Policy" || part === "Returns & Refunds Policy") {
          return (
            <Link key={i} href={`/policies/${part === "Shipping Policy" ? "shipping" : "returns"}`} className="font-semibold underline underline-offset-2 hover:text-[var(--flavor)]">
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export default function Policy() {
  const { slug } = useParams<{ slug: string }>();
  const policy = POLICIES.find(p => p.slug === slug);
  if (!policy) return <NotFound />;

  return (
    <>
      <section className="wall grain relative overflow-hidden px-5 pb-10 pt-32 md:px-8 md:pt-40">
        <div className="pointer-events-none absolute -right-20 top-10 h-96 w-96 glow opacity-30" />
        <div className="relative mx-auto max-w-6xl">
          <p className="label text-[var(--flavor)]">Policies · {policy.subtitle}</p>
          <h1 className="font-display mt-3 text-[14vw] md:text-[7.5rem]">{policy.title}</h1>
          <nav aria-label="Policies" className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
            {POLICIES.map(p => (
              <Link
                key={p.slug}
                href={`/policies/${p.slug}`}
                className={cn(
                  "label shrink-0 border-2 px-3 py-2.5 text-[0.65rem] transition",
                  p.slug === slug ? "border-[var(--flavor)] bg-[var(--flavor)] text-black" : "border-white/15 hover:border-white/50"
                )}
              >
                {p.title}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <Tape tilt={-1.5} words={["Krunk'd", "Website policies", "21+ only", "hello@krunkd.com"]} />
      <section className="paper px-5 py-16 md:px-8 md:py-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[220px_1fr]"
          >
            <aside className="hidden md:block">
              <div className="sticky top-28 space-y-1 border-l-4 border-black pl-4">
                {policy.sections.map((s, i) => (
                  <a key={s.heading} href={`#s${i}`} className="block py-1 text-sm font-semibold text-black/60 hover:text-black">
                    {s.heading}
                  </a>
                ))}
              </div>
            </aside>
            <div className="space-y-6">
              {policy.sections.map((s, i) => (
                <article key={s.heading} id={`s${i}`} className="scroll-mt-28 border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_#000] md:p-8">
                  <h2 className="font-display text-3xl md:text-4xl">{s.heading}</h2>
                  <p className="mt-3 leading-relaxed text-black/80 md:text-lg">
                    <RichText text={s.body} />
                  </p>
                </article>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
