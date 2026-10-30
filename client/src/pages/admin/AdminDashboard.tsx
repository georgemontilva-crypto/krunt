import { ORDER_STATUS_LABEL } from "@shared/const";
import { Link } from "wouter";
import { formatMoney } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { AdminTitle } from "./AdminApp";

export function AdminDashboard() {
  const { data } = trpc.site.dashboard.useQuery();
  const cards = [
    { label: "Awaiting payment", value: data?.awaitingPayment, href: "/admin/orders" },
    { label: "To ship", value: data?.toShip, href: "/admin/orders" },
    { label: "Wholesale to review", value: data?.pendingWholesale, href: "/admin/wholesale" },
    { label: "Open messages", value: data?.openMessages, href: "/admin/messages" },
  ];
  return (
    <>
      <AdminTitle title="Dashboard" />
      {data && !data.mailConfigured && (
        <p className="mb-6 border-2 border-yellow-400/60 p-4 text-sm text-yellow-200">
          Email is off: set RESEND_API_KEY and RESEND_FROM_EMAIL so customers get order confirmations. Everything is still saved here.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(c => (
          <Link key={c.label} href={c.href} className="border-2 border-white/10 p-5 hover:border-[var(--flavor)]">
            <p className="label text-smoke">{c.label}</p>
            <p className="font-display mt-2 text-6xl">{c.value ?? "–"}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 border-2 border-white/10 p-5">
        <p className="label text-smoke">Revenue from paid orders</p>
        <p className="font-display mt-2 text-6xl text-[var(--flavor)]">{data ? formatMoney(data.paidRevenueCents) : "–"}</p>
        <p className="text-sm text-smoke">{data?.totalOrders ?? 0} orders total</p>
      </div>
      <h2 className="font-display mt-10 text-3xl">Latest orders</h2>
      <div className="mt-3 divide-y divide-white/10 border-2 border-white/10">
        {data?.recent.length ? (
          data.recent.map(o => (
            <Link key={o.id} href={`/admin/orders?id=${o.id}`} className="grid grid-cols-2 gap-2 p-4 hover:bg-white/5 md:grid-cols-5">
              <span className="font-bold">{o.number}</span>
              <span className="truncate text-smoke">{o.customerName}</span>
              <span className="label text-[0.65rem]">{o.channel}</span>
              <span className="label text-[0.65rem]">{ORDER_STATUS_LABEL[o.status]}</span>
              <span className="font-bold md:text-right">{formatMoney(o.totalCents)}</span>
            </Link>
          ))
        ) : (
          <p className="p-4 text-smoke">No orders yet.</p>
        )}
      </div>
    </>
  );
}
