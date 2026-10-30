import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, X, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Logo, Mark } from "./Brand";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/lab-reports", label: "Lab Reports" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [loc] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const cart = useCart();
  const me = trpc.wholesale.me.useQuery(undefined, { staleTime: 60_000 });

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [loc]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const isActive = (href: string) => (href === "/" ? loc === "/" : loc.startsWith(href));
  const wholesaleLabel = me.data?.status === "approved" ? "Wholesale ✓" : "Wholesale";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || menu ? "bg-black/80 py-2 backdrop-blur-md" : "py-4"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" aria-label="Krunk'd home" className="relative z-10 shrink-0">
            <Logo className={cn("transition-all duration-300", scrolled ? "w-28 md:w-32" : "w-32 md:w-40")} />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                data-text={n.label}
                className={cn(
                  "glitch label relative px-3 py-2 text-[0.8rem] transition-colors",
                  isActive(n.href) ? "text-[var(--flavor)]" : "text-paper hover:text-white"
                )}
              >
                {n.label}
                {isActive(n.href) && (
                  <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-[3px] bg-[var(--flavor)]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            <Link
              href="/wholesale"
              className="label hidden border-2 border-paper/70 px-3 py-2 text-[0.7rem] transition hover:border-[var(--flavor)] hover:text-[var(--flavor)] sm:block"
            >
              {wholesaleLabel}
            </Link>
            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center bg-[var(--flavor)] text-black transition hover:rotate-[-6deg]"
              aria-label={`Open cart, ${cart.count} items`}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key={cart.count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black bg-blood px-1 text-xs font-black text-white"
                  >
                    {cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => setMenu(m => !m)}
              className="flex h-11 w-11 items-center justify-center border-2 border-paper/70 lg:hidden"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[var(--flavor)] px-6 pb-10 pt-28 text-black lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
          >
            <Mark white className="pointer-events-none absolute -right-16 bottom-10 w-72 rotate-12 opacity-20 invert" />
            <nav className="relative flex flex-col gap-1" aria-label="Mobile">
              {[...NAV, { href: "/wholesale", label: wholesaleLabel }].map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={{ x: -60, opacity: 0, rotate: -4 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Link href={n.href} className="font-display block py-1 text-[3.3rem] leading-none">
                    {isActive(n.href) && <span className="mr-2">→</span>}
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <p className="label relative mt-auto pt-10">21+ only · Premium botanical · Blue Lotus infused</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
