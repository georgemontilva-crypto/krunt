import { FLAVORS, flavorByKey, type FlavorKey } from "@shared/const";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Splat } from "@/components/Brand";
import { PageHead, Reveal } from "@/components/Bits";
import { Tape } from "@/components/Tape";
import { formatMoney, useCatalog, type CatalogProduct } from "@/lib/catalog";
import { packImage, useFlavor } from "@/lib/store";
import { cn } from "@/lib/utils";

function Billboard({ p, index, wholesale }: { p: CatalogProduct; index: number; wholesale: boolean }) {
  const { flavor: globalFlavor, setFlavor } = useFlavor();
  const [flavor, setLocal] = useState<FlavorKey>(globalFlavor);
  const f = flavorByKey(flavor);
  const flip = index % 2 === 1;
  const price = wholesale && p.wholesalePriceCents != null ? p.wholesalePriceCents : p.retailPriceCents;

  return (
    <section className="relative overflow-hidden border-b-2 border-white/10">
      <motion.div aria-hidden className="absolute inset-0 opacity-[0.13]" animate={{ background: `radial-gradient(circle at ${flip ? "25%" : "75%"} 50%, ${f.color}, transparent 60%)` }} />
      <div className={cn("relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24", flip && "md:[&>*:first-child]:order-2")}>
        <Link href={`/products/${p.slug}`} onClick={() => setFlavor(flavor)} className="group relative flex aspect-square items-center justify-center" data-cursor="link">
          <div className="absolute inset-0 transition-colors duration-500" style={{ color: f.color }}>
            <Splat seed={index * 3 + 1} className="h-full w-full opacity-90 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-105" />
          </div>
          <span className="font-display absolute left-0 top-0 text-[9rem] leading-none text-white/10 md:text-[12rem]">0{index + 1}</span>
          <AnimatePresence mode="popLayout">
            <motion.img
              key={flavor}
              src={packImage(p.slug, flavor)}
              alt={`${p.shortName} ${f.name}`}
              initial={{ y: 80, opacity: 0, rotate: 15 }}
              animate={{ y: 0, opacity: 1, rotate: flip ? 5 : -5 }}
              exit={{ y: -80, opacity: 0, rotate: -15 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="relative h-[86%] w-auto object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:scale-105"
            />
          </AnimatePresence>
        </Link>
        <div>
          <Reveal>
            <p className="label" style={{ color: f.color }}>{p.netWeight}</p>
            <h2 className="font-display mt-2 text-[15vw] md:text-[7rem]">{p.shortName}</h2>
            <p className="mt-2 text-2xl font-bold">{p.tagline}</p>
            <p className="mt-4 max-w-lg text-smoke">{p.description}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {FLAVORS.map(fl => (
                <button
                  key={fl.key}
                  type="button"
                  onClick={() => setLocal(fl.key)}
                  aria-pressed={fl.key === flavor}
                  className={cn("label border-2 px-3 py-2 text-[0.62rem] transition", fl.key === flavor ? "text-black" : "border-white/15")}
                  style={fl.key === flavor ? { background: fl.color, borderColor: fl.color } : undefined}
                >
                  {fl.name}
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href={`/products/${p.slug}`} onClick={() => setFlavor(flavor)} className="btn btn-spray" style={{ ["--flavor" as string]: f.color }}>
                See it in 3D <ArrowRight className="h-5 w-5" />
              </Link>
              <p>
                <span className="font-display text-5xl">{formatMoney(price)}</span>
                <span className="label ml-2 text-smoke">{wholesale ? `/ unit · case ${p.caseSize}` : "each"}</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Products() {
  const { data } = useCatalog();
  return (
    <>
      <PageHead kicker="Shop" title="The goods">
        <p className="mt-6 max-w-xl text-lg text-smoke">Three formats, six flavors, one attitude. Pick a format, pick a flavor, spin it in 3D.</p>
      </PageHead>
      <Tape tilt={-1.5} />
      <div className="bg-ink">
        {data?.products.map((p, i) => <Billboard key={p.slug} p={p} index={i} wholesale={data.wholesale} />) ?? <div className="h-[80vh]" />}
      </div>
    </>
  );
}
