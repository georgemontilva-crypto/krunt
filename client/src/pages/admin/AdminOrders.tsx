import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@shared/const";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { Field, Input, Select, Textarea } from "@/components/Form";
import { formatMoney } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AdminTitle } from "./AdminApp";

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-400 text-black",
  paid: "bg-[var(--flavor)] text-black",
  processing: "bg-sky-400 text-black",
  shipped: "bg-violet-400 text-black",
  completed: "bg-white/20 text-white",
  cancelled: "bg-blood text-white",
};

function OrderPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: o } = trpc.orders.adminGet.useQuery({ id });
  const update = trpc.orders.adminUpdate.useMutation();
  const [status, setStatus] = useState<OrderStatus>("pending_payment");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (!o) return;
    setStatus(o.status);
    setTracking(o.trackingNumber ?? "");
    setNotes(o.adminNotes ?? "");
  }, [o]);

  const save = async () => {
    try {
      await update.mutateAsync({ id, status, trackingNumber: tracking || null, adminNotes: notes || null, notifyCustomer: notify && status !== o?.status });
      toast.success("Order updated");
      utils.orders.invalidate();
      utils.site.dashboard.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto border-l-2 border-[var(--flavor)] bg-ink p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-4xl">{o?.number ?? "…"}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {o && (
          <>
            <p className="text-sm text-smoke">{new Date(o.createdAt).toLocaleString()} · <span className="uppercase">{o.channel}</span></p>
            <div className="mt-5 grid gap-1 text-sm">
              <p className="font-bold">{o.businessName && `${o.businessName} — `}{o.customerName}</p>
              <p><a className="underline" href={`mailto:${o.email}`}>{o.email}</a> · <a className="underline" href={`tel:${o.phone}`}>{o.phone}</a></p>
              <p className="text-smoke">{o.address}{o.address2 ? `, ${o.address2}` : ""}, {o.city}, {o.state} {o.zip}</p>
              {o.notes && <p className="mt-2 border-l-2 border-[var(--flavor)] pl-3">"{o.notes}"</p>}
            </div>
            <ul className="mt-5 divide-y divide-white/10 border-2 border-white/10 text-sm">
              {o.items.map(i => (
                <li key={i.id} className="flex justify-between p-3">
                  <span>{i.quantity} × {i.productName} — <b>{i.flavorName}</b> <span className="text-smoke">@ {formatMoney(i.unitPriceCents)}</span></span>
                  <span>{formatMoney(i.lineTotalCents)}</span>
                </li>
              ))}
              <li className="flex justify-between p-3"><span className="text-smoke">Shipping</span><span>{formatMoney(o.shippingCents)}</span></li>
              <li className="flex justify-between p-3 font-bold"><span>Total</span><span>{formatMoney(o.totalCents)}</span></li>
            </ul>
            <div className="mt-6 grid gap-4">
              <Field label="Status">
                <Select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                </Select>
              </Field>
              <Field label="Tracking number"><Input value={tracking} onChange={e => setTracking(e.target.value)} /></Field>
              <Field label="Internal notes"><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-24" /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="h-4 w-4 accent-[var(--flavor)]" />
                Email the customer when the status changes
              </label>
              <button type="button" className="btn btn-spray" onClick={save} disabled={update.isPending}>Save</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminOrders() {
  const search = new URLSearchParams(useSearch());
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [channel, setChannel] = useState<"" | "retail" | "wholesale">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(search.get("id") ? Number(search.get("id")) : null);
  const { data } = trpc.orders.adminList.useQuery({ status: status || undefined, channel: channel || undefined, search: q || undefined, page });
  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;

  return (
    <>
      <AdminTitle title="Orders" />
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <Input placeholder="Search number, name, email" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        <Select value={status} onChange={e => { setStatus(e.target.value as OrderStatus | ""); setPage(1); }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </Select>
        <Select value={channel} onChange={e => { setChannel(e.target.value as "" | "retail" | "wholesale"); setPage(1); }}>
          <option value="">Retail + wholesale</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </Select>
      </div>
      <div className="overflow-x-auto border-2 border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="label bg-white/5 text-smoke">
            <tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Channel</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data?.rows.map(o => (
              <tr key={o.id} className="cursor-pointer hover:bg-white/5" onClick={() => setOpenId(o.id)}>
                <td className="p-3 font-bold">{o.number}</td>
                <td className="p-3 text-smoke">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-3">{o.customerName}<br /><span className="text-xs text-smoke">{o.email}</span></td>
                <td className="p-3 uppercase">{o.channel}</td>
                <td className="p-3"><span className={cn("label px-2 py-1 text-[0.6rem]", STATUS_COLOR[o.status])}>{ORDER_STATUS_LABEL[o.status]}</span></td>
                <td className="p-3 text-right font-bold">{formatMoney(o.totalCents)}</td>
              </tr>
            ))}
            {data && !data.rows.length && <tr><td colSpan={6} className="p-6 text-center text-smoke">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn btn-ghost min-h-10" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>{page} / {pages}</span>
          <button type="button" className="btn btn-ghost min-h-10" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
      {openId && <OrderPanel id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
