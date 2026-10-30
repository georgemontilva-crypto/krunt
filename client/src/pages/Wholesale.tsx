import { ORDER_STATUS_LABEL } from "@shared/const";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Boxes, Clock, LogOut, Percent, Truck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { PageHead, Reveal } from "@/components/Bits";
import { Field, formObject, Input, StateSelect } from "@/components/Form";
import { formatMoney } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

function useRefreshAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

function Account() {
  const me = trpc.wholesale.me.useQuery().data!;
  const orders = trpc.wholesale.myOrders.useQuery(undefined, { enabled: me.status === "approved" });
  const logout = trpc.wholesale.logout.useMutation();
  const refresh = useRefreshAll();

  const badge =
    me.status === "approved"
      ? { icon: Boxes, text: "Approved: wholesale pricing is live on every product.", cls: "border-[var(--flavor)] text-[var(--flavor)]" }
      : me.status === "pending"
        ? { icon: Clock, text: "Under review. We'll email you as soon as you're approved (usually within 1 business day).", cls: "border-yellow-400 text-yellow-300" }
        : { icon: XCircle, text: "This application wasn't approved. Contact us if you think that's a mistake.", cls: "border-blood text-blood" };

  return (
    <section className="bg-ink px-5 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label text-smoke">Signed in as</p>
            <h2 className="font-display mt-1 text-5xl md:text-7xl">{me.businessName}</h2>
            <p className="text-smoke">{me.contactName} · {me.email}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await logout.mutateAsync();
              refresh();
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <div className={cn("mt-8 flex items-center gap-3 border-2 p-5", badge.cls)}>
          <badge.icon className="h-6 w-6 shrink-0" />
          <p className="font-bold">{badge.text}</p>
        </div>
        {me.status === "approved" && (
          <>
            <Link href="/products" className="btn btn-spray mt-8">Start a wholesale order →</Link>
            <h3 className="font-display mt-14 text-4xl">Your orders</h3>
            <div className="mt-4 divide-y divide-white/10 border-2 border-white/10">
              {orders.data?.length ? (
                orders.data.map(o => (
                  <Link key={o.number} href={`/order/${o.number}?k=${o.accessKey}`} className="flex items-center justify-between gap-4 p-4 hover:bg-white/5">
                    <span className="font-bold">{o.number}</span>
                    <span className="text-sm text-smoke">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="label text-[0.65rem]">{ORDER_STATUS_LABEL[o.status]}</span>
                    <span className="font-bold">{formatMoney(o.totalCents)}</span>
                  </Link>
                ))
              ) : (
                <p className="p-5 text-smoke">No orders yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Forms() {
  const [tab, setTab] = useState<"apply" | "login">("apply");
  const apply = trpc.wholesale.register.useMutation();
  const login = trpc.wholesale.login.useMutation();
  const refresh = useRefreshAll();

  const onApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = formObject(e.currentTarget);
    if (v.password !== v.password2) return toast.error("Passwords don't match");
    try {
      await apply.mutateAsync({
        businessName: v.businessName,
        contactName: v.contactName,
        email: v.email,
        phone: v.phone,
        password: v.password,
        taxId: v.taxId || undefined,
        website: v.website || undefined,
        address: v.address,
        city: v.city,
        state: v.state,
        zip: v.zip,
      });
      toast.success("Application received!");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit");
    }
  };
  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = formObject(e.currentTarget);
    try {
      await login.mutateAsync({ email: v.email, password: v.password });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign in");
    }
  };

  return (
    <section className="bg-ink px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          {[
            { icon: Percent, t: "Case pricing", d: "Wholesale prices on every format, shown the moment you're approved." },
            { icon: Boxes, t: "All six flavors", d: "Mix flavors by the case. Display-ready packaging." },
            { icon: Truck, t: "Freight quoted", d: "We quote shipping with your invoice so you pay what it actually costs." },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 0.08}>
              <div className="flex gap-4 border-2 border-white/10 p-5">
                <b.icon className="h-7 w-7 shrink-0 text-[var(--flavor)]" />
                <div>
                  <p className="font-display text-3xl">{b.t}</p>
                  <p className="text-smoke">{b.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="border-2 border-white/10 bg-wall">
          <div className="grid grid-cols-2 border-b-2 border-white/10" role="tablist">
            {(["apply", "login"] as const).map(t => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("label relative py-4", tab === t ? "text-black" : "text-paper")}>
                {tab === t && <motion.span layoutId="ws-tab" className="absolute inset-0 bg-[var(--flavor)]" />}
                <span className="relative">{t === "apply" ? "Apply" : "Sign in"}</span>
              </button>
            ))}
          </div>
          {tab === "apply" ? (
            <form onSubmit={onApply} className="grid gap-5 p-6 md:grid-cols-2 md:p-10">
              <Field label="Business name *"><Input name="businessName" required autoComplete="organization" /></Field>
              <Field label="Contact name *"><Input name="contactName" required autoComplete="name" /></Field>
              <Field label="Email *"><Input name="email" type="email" required autoComplete="email" /></Field>
              <Field label="Phone *"><Input name="phone" type="tel" required autoComplete="tel" /></Field>
              <Field label="Resale / tax ID"><Input name="taxId" /></Field>
              <Field label="Website or Instagram"><Input name="website" /></Field>
              <Field label="Street address *" className="md:col-span-2"><Input name="address" required autoComplete="street-address" /></Field>
              <Field label="City *"><Input name="city" required autoComplete="address-level2" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State *"><StateSelect name="state" required /></Field>
                <Field label="ZIP *"><Input name="zip" required inputMode="numeric" autoComplete="postal-code" /></Field>
              </div>
              <Field label="Password *" hint="8+ characters"><Input name="password" type="password" required minLength={8} autoComplete="new-password" /></Field>
              <Field label="Confirm password *"><Input name="password2" type="password" required minLength={8} autoComplete="new-password" /></Field>
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-spray w-full" disabled={apply.isPending}>
                  {apply.isPending ? "Submitting…" : "Submit application"}
                </button>
                <p className="mt-3 text-xs text-smoke">Every account is reviewed by hand. You'll get an email when it's approved.</p>
              </div>
            </form>
          ) : (
            <form onSubmit={onLogin} className="grid gap-5 p-6 md:p-10">
              <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
              <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
              <button type="submit" className="btn btn-spray" disabled={login.isPending}>
                {login.isPending ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-xs text-smoke">Forgot your password? <Link href="/contact" className="underline">Contact us</Link> and we'll reset it.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Wholesale() {
  const me = trpc.wholesale.me.useQuery();
  return (
    <>
      <PageHead kicker="Wholesale" title="Stock Krunk'd">
        <p className="mt-6 max-w-xl text-lg text-smoke">Smoke shops, convenience stores, distributors: get approved and order by the case.</p>
      </PageHead>
      {me.isLoading ? <div className="h-96 bg-ink" /> : me.data ? <Account /> : <Forms />}
    </>
  );
}
