import { AtSign, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Drips, Logo } from "./Brand";
import { NAV } from "./Header";

export function Footer() {
  const s = trpc.site.settings.useQuery(undefined, { staleTime: 5 * 60_000 }).data;
  return (
    <footer className="relative mt-auto overflow-hidden bg-black pt-1">
      <div className="text-[var(--flavor)]">
        <div className="h-3 bg-[var(--flavor)]" />
        <Drips className="h-16 -mt-px" count={18} seed={7} />
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-10 pt-6 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <Logo className="w-56" />
          <p className="mt-5 max-w-sm text-smoke">
            Premium botanical disposables and pre-rolls, infused with Blue Lotus. Loud packs, clean pulls, made for the 21+ crowd.
          </p>
          <div className="mt-6 flex gap-3">
            {s?.instagram && (
              <a href={s.instagram.startsWith("http") ? s.instagram : `https://instagram.com/${s.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex h-11 w-11 items-center justify-center border-2 border-paper/40 hover:border-[var(--flavor)] hover:text-[var(--flavor)]" aria-label="Instagram">
                <AtSign className="h-5 w-5" />
              </a>
            )}
            {s?.email && (
              <a href={`mailto:${s.email}`} className="flex h-11 w-11 items-center justify-center border-2 border-paper/40 hover:border-[var(--flavor)] hover:text-[var(--flavor)]" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="label text-[var(--flavor)]">Explore</p>
          <ul className="mt-4 space-y-2">
            {[...NAV, { href: "/wholesale", label: "Wholesale" }].map(n => (
              <li key={n.href}>
                <Link href={n.href} className="font-display text-2xl hover:text-[var(--flavor)]">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label text-[var(--flavor)]">Hit us up</p>
          <ul className="mt-4 space-y-3 text-smoke">
            {s?.email && (
              <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${s.email}`} className="hover:text-paper">{s.email}</a></li>
            )}
            {s?.phone && (
              <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="hover:text-paper">{s.phone}</a></li>
            )}
            {s?.address && (
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{s.address}</span></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-smoke md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} {s?.company || "Krunk'd"}. All rights reserved.</p>
          <p className="max-w-2xl md:text-right">
            For adults 21+ only. Keep out of reach of children and pets. These products have not been evaluated by the FDA and are not intended to diagnose, treat, cure or prevent any disease.
          </p>
        </div>
      </div>
      <p aria-hidden className="font-display pointer-events-none select-none whitespace-nowrap text-center text-[23vw] leading-[0.75] text-white/[0.04]">
        KRUNK'D
      </p>
    </footer>
  );
}
