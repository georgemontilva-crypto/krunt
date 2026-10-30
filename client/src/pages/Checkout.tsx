import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { Field, formObject, Input, StateSelect, Textarea } from "@/components/Form";
import { formatMoney, resolveCart, useCatalog } from "@/lib/catalog";
import { packImage, useCart } from "@/lib/store";
import { trpc } from "@/lib/trpc";

export default function Checkout() {
  const cart = useCart();
  const [, nav] = useLocation();
  const { data } = useCatalog();
  const settings = trpc.site.settings.useQuery().data;
  const me = trpc.wholesale.me.useQuery().data;
  const place = trpc.orders.place.useMutation();
  const qc = useQueryClient();
  const [age, setAge] = useState(false);
  const { items, subtotal, problems } = resolveCart(cart.lines, data);

  const wholesale = Boolean(data?.wholesale);
  const freeOver = Number(settings?.freeShippingOverCents ?? 0);
  const flat = Number(settings?.retailShippingCents ?? 0);
  const shipping = wholesale ? 0 : freeOver > 0 && subtotal >= freeOver ? 0 : flat;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!age) return toast.error("Please confirm you're 21 or older");
    const v = formObject(e.currentTarget);
    try {
      const res = await place.mutateAsync({
        items: cart.lines,
        customerName: v.customerName,
        email: v.email,
        phone: v.phone,
        businessName: v.businessName || undefined,
        address: v.address,
        address2: v.address2 || undefined,
        city: v.city,
        state: v.state,
        zip: v.zip,
        notes: v.notes || undefined,
        ageConfirmed: true,
      });
      cart.clear();
      qc.invalidateQueries();
      nav(`/order/${res.number}?k=${res.accessKey}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't place the order");
    }
  };

  if (!items.length) {
    return (
      <section className="wall flex min-h-[80svh] flex-col items-center justify-center px-5 pt-24 text-center">
        <p className="font-display text-7xl text-white/20">Cart's empty.</p>
        <Link href="/products" className="btn btn-spray mt-6">Go shopping</Link>
      </section>
    );
  }

  return (
    <section className="wall min-h-[100svh] px-5 pb-20 pt-32 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="label text-[var(--flavor)]">{wholesale ? "Wholesale checkout" : "Checkout"}</p>
        <h1 className="font-display mt-2 text-[16vw] md:text-[7rem]">Lock it in</h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={submit} className="grid gap-5 border-2 border-white/10 bg-black/40 p-6 md:grid-cols-2 md:p-8" id="checkout">
            <h2 className="font-display text-3xl md:col-span-2">Contact</h2>
            <Field label="Full name *"><Input name="customerName" required autoComplete="name" defaultValue={me?.contactName} /></Field>
            <Field label="Email *"><Input name="email" type="email" required autoComplete="email" defaultValue={me?.email} /></Field>
            <Field label="Phone *"><Input name="phone" type="tel" required autoComplete="tel" defaultValue={me?.phone} /></Field>
            {!wholesale && <Field label="Company (optional)"><Input name="businessName" autoComplete="organization" /></Field>}
            <h2 className="font-display mt-4 text-3xl md:col-span-2">Ship to</h2>
            <Field label="Street address *" className="md:col-span-2"><Input name="address" required autoComplete="address-line1" defaultValue={me?.address} /></Field>
            <Field label="Apt, suite (optional)" className="md:col-span-2"><Input name="address2" autoComplete="address-line2" /></Field>
            <Field label="City *"><Input name="city" required autoComplete="address-level2" defaultValue={me?.city} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State *"><StateSelect name="state" required autoComplete="address-level1" defaultValue={me?.state} /></Field>
              <Field label="ZIP *"><Input name="zip" required inputMode="numeric" pattern="\d{5}(-\d{4})?" autoComplete="postal-code" defaultValue={me?.zip} /></Field>
            </div>
            <Field label="Order notes" className="md:col-span-2"><Textarea name="notes" maxLength={2000} className="min-h-24" /></Field>
            <label className="flex items-start gap-3 md:col-span-2">
              <input type="checkbox" checked={age} onChange={e => setAge(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--flavor)]" required />
              <span className="text-sm">I confirm I am 21 years of age or older and that these products are legal where I live.</span>
            </label>
          </form>

          <aside className="h-fit border-2 border-[var(--flavor)] bg-black/60 p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-3xl">Order</h2>
            <ul className="mt-4 divide-y divide-white/10">
              {items.map(i => (
                <li key={i.variant.id} className="flex items-center gap-3 py-3">
                  <img src={packImage(i.product.slug, i.flavor.key)} alt="" className="h-14 w-auto" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight" style={{ color: i.flavor.color }}>{i.flavor.name}</p>
                    <p className="text-xs text-smoke">{i.product.shortName} × {i.line.quantity}</p>
                  </div>
                  <p className="font-bold tabular-nums">{formatMoney(i.total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-smoke">Shipping</dt>
                <dd>{wholesale ? "Quoted with invoice" : shipping ? formatMoney(shipping) : "Free"}</dd>
              </div>
              {!wholesale && freeOver > 0 && subtotal < freeOver && (
                <p className="text-xs text-[var(--flavor)]">Add {formatMoney(freeOver - subtotal)} more for free shipping.</p>
              )}
              <div className="flex items-end justify-between border-t border-white/10 pt-3">
                <dt className="label">Total</dt>
                <dd className="font-display text-4xl">{formatMoney(subtotal + shipping)}</dd>
              </div>
            </dl>
            {problems.length > 0 && <ul className="mt-3 text-sm text-blood">{problems.map(p => <li key={p}>• {p}</li>)}</ul>}
            <div className="mt-5 flex gap-3 border border-white/15 p-3 text-xs text-smoke">
              <Lock className="h-4 w-4 shrink-0 text-[var(--flavor)]" />
              <p>{settings?.paymentInstructions}</p>
            </div>
            <button type="submit" form="checkout" className="btn btn-spray mt-5 w-full" disabled={place.isPending || problems.length > 0}>
              {place.isPending ? "Placing order…" : "Place order"}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
