import { LayoutDashboard, LogOut, Mail, Package, Receipt, Settings, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, Route, Switch, useLocation } from "wouter";
import { Logo } from "@/components/Brand";
import { Field, formObject, Input } from "@/components/Form";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AdminDashboard } from "./AdminDashboard";
import { AdminMessages } from "./AdminMessages";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminSettings } from "./AdminSettings";
import { AdminWholesale } from "./AdminWholesale";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/wholesale", label: "Wholesale", icon: Store },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AuthScreen() {
  const status = trpc.adminAuth.setupStatus.useQuery();
  const utils = trpc.useUtils();
  const login = trpc.adminAuth.login.useMutation();
  const setup = trpc.adminAuth.setup.useMutation();
  const needsSetup = status.data?.needsSetup;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = formObject(e.currentTarget);
    try {
      if (needsSetup) await setup.mutateAsync({ email: v.email, password: v.password, name: v.name || undefined, setupToken: v.token });
      else await login.mutateAsync({ email: v.email, password: v.password });
      await utils.adminAuth.me.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="wall flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border-2 border-white/10 bg-black/60 p-8">
        <Logo className="w-40" />
        <h1 className="font-display text-4xl">{needsSetup ? "Create admin" : "Admin sign in"}</h1>
        {needsSetup && !status.data?.setupEnabled && (
          <p className="text-sm text-blood">Set ADMIN_SETUP_TOKEN in Railway to create the first admin.</p>
        )}
        {needsSetup && <Field label="Name"><Input name="name" /></Field>}
        <Field label="Email"><Input name="email" type="email" required autoComplete="username" /></Field>
        <Field label="Password"><Input name="password" type="password" required minLength={needsSetup ? 8 : 1} autoComplete={needsSetup ? "new-password" : "current-password"} /></Field>
        {needsSetup && <Field label="Setup token"><Input name="token" required /></Field>}
        <button type="submit" className="btn btn-spray w-full" disabled={login.isPending || setup.isPending}>
          {needsSetup ? "Create" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const me = trpc.adminAuth.me.useQuery(undefined, { retry: false });
  const logout = trpc.adminAuth.logout.useMutation();
  const utils = trpc.useUtils();
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const stats = trpc.site.dashboard.useQuery(undefined, { enabled: Boolean(me.data), refetchInterval: 60_000 });

  if (me.isLoading) return <div className="min-h-screen bg-ink" />;
  if (!me.data) return <AuthScreen />;

  const badge = (href: string) =>
    href === "/admin/orders" ? stats.data?.awaitingPayment : href === "/admin/wholesale" ? stats.data?.pendingWholesale : href === "/admin/messages" ? stats.data?.openMessages : 0;

  return (
    <div className="min-h-screen bg-ink text-paper md:flex">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r-2 border-white/10 bg-black p-5 transition-transform md:static md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link href="/admin"><Logo className="w-36" /></Link>
        <p className="label mt-2 text-smoke">Admin</p>
        <nav className="mt-8 space-y-1">
          {NAV.map(n => {
            const active = n.href === "/admin" ? loc === "/admin" : loc.startsWith(n.href);
            const b = badge(n.href);
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 font-bold", active ? "bg-[var(--flavor)] text-black" : "hover:bg-white/5")}>
                <n.icon className="h-4 w-4" /> <span className="flex-1">{n.label}</span>
                {!!b && <span className="rounded-full bg-blood px-2 text-xs text-white">{b}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-5 bottom-5 space-y-2">
          <p className="truncate text-xs text-smoke">{me.data.email}</p>
          <a href="/" className="block text-sm text-smoke hover:text-paper">← View site</a>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-smoke hover:text-blood"
            onClick={async () => {
              await logout.mutateAsync();
              utils.adminAuth.me.reset();
              await utils.adminAuth.me.invalidate();
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b-2 border-white/10 px-5 py-3 md:hidden">
          <Logo className="w-28" />
          <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={() => setOpen(true)}>Menu</button>
        </header>
        <main className="p-5 md:p-10">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/wholesale" component={AdminWholesale} />
            <Route path="/admin/products" component={AdminProducts} />
            <Route path="/admin/messages" component={AdminMessages} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route><p>Not found</p></Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      {children}
    </div>
  );
}
