import { flavorByKey, FLAVORS, ORDER_STATUS_LABEL } from "@shared/const";
import { motion } from "motion/react";
import { Link, useParams, useSearch } from "wouter";
import { Mark } from "@/components/Brand";
import { formatMoney } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import NotFound from "./NotFound";

export default function OrderPage() {
  const { number } = useParams<{ number: string }>();
  const key = new URLSearchParams(useSearch()).get("k") ?? "";
  const q = trpc.orders.get.useQuery({ number, key }, { retry: false });
  const settings = trpc.site.settings.useQuery().data;

  if (q.isError) return <NotFound />;
  const o = q.data;

  return (
    <section className="wall grain relative min-h-[100svh] overflow-hidden px-5 pb-20 pt-32 md:px-8">
      {/* Confetti of paint */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute top-0 h-3 w-3 rounded-full"
          style={{ left: `${(i * 4.3) % 100}%`, background: FLAVORS[i % 6].color }}
          initial={{ y: -40, opacity: 1 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 }}
          transition={{ duration: 2.5 + (i % 5) * 0.4, delay: (i % 8) * 0.12, ease: "easeIn" }}
        />
      ))}
      <div className="relative mx-auto max-w-3xl">
        {!o ? (
          <div className="h-96 animate-pulse bg-white/5" />
        ) : (
          <>
            <Mark className="w-24 animate-wobble" />
            <p className="label mt-6 text-[var(--flavor)]">Order {o.number}</p>
            <h1 className="font-display mt-2 text-[15vw] md:text-[7rem]">You're krunk'd!</h1>
            <div className="mt-6 border-2 border-[var(--flavor)] bg-black/60 p-5">
              <p className="label text-[var(--flavor)]">Status: {ORDER_STATUS_LABEL[o.status]}</p>
              {o.status === "pending_payment" && <p className="mt-2 text-lg">{settings?.paymentInstructions}</p>}
              {o.trackingNumber && <p className="mt-2">Tracking: <span className="font-bold">{o.trackingNumber}</span></p>}
              <p className="mt-2 text-sm text-smoke">A confirmation was sent to {o.email}. Save this page link to check your order later.</p>
            </div>
            <ul className="mt-8 divide-y divide-white/10 border-2 border-white/10">
              {o.items.map(i => (
                <li key={i.id} className="flex items-center justify-between gap-4 p-4">
                  <span>
                    <span className="font-bold" style={{ color: FLAVORS.find(f => f.name === i.flavorName)?.color ?? flavorByKey("").color }}>{i.flavorName}</span>
                    <span className="text-smoke"> · {i.productName} × {i.quantity}</span>
                  </span>
                  <span className="font-bold tabular-nums">{formatMoney(i.lineTotalCents)}</span>
                </li>
              ))}
              <li className="flex justify-between p-4 text-sm"><span className="text-smoke">Shipping</span><span>{o.channel === "wholesale" && !o.shippingCents ? "Quoted with invoice" : o.shippingCents ? formatMoney(o.shippingCents) : "Free"}</span></li>
              <li className="flex items-end justify-between p-4"><span className="label">Total</span><span className="font-display text-4xl">{formatMoney(o.totalCents)}</span></li>
            </ul>
            <div className="mt-6 text-sm text-smoke">
              <p className="label mb-1">Shipping to</p>
              <p>{o.businessName && <>{o.businessName}<br /></>}{o.customerName}<br />{o.address}{o.address2 ? `, ${o.address2}` : ""}<br />{o.city}, {o.state} {o.zip}</p>
            </div>
            <Link href="/products" className="btn btn-spray mt-10">Keep shopping</Link>
          </>
        )}
      </div>
    </section>
  );
}
