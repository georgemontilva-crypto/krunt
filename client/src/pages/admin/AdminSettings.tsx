import { toast } from "sonner";
import { Field, formObject, Input, Textarea } from "@/components/Form";
import { trpc } from "@/lib/trpc";
import { AdminTitle } from "./AdminApp";

export function AdminSettings() {
  const utils = trpc.useUtils();
  const s = trpc.site.settings.useQuery().data;
  const save = trpc.site.updateSettings.useMutation();
  const admins = trpc.adminAuth.listAdmins.useQuery().data;
  const create = trpc.adminAuth.createAdmin.useMutation();
  const remove = trpc.adminAuth.deleteAdmin.useMutation();
  const pw = trpc.adminAuth.changePassword.useMutation();
  const me = trpc.adminAuth.me.useQuery().data;

  if (!s) return null;
  const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed");

  return (
    <>
      <AdminTitle title="Settings" />
      <form
        className="grid gap-4 border-2 border-white/10 p-6 md:grid-cols-2"
        onSubmit={async e => {
          e.preventDefault();
          const v = formObject(e.currentTarget);
          try {
            await save.mutateAsync({
              company: v.company,
              email: v.email,
              phone: v.phone,
              address: v.address,
              instagram: v.instagram,
              retailShippingCents: String(Math.round(parseFloat(v.ship || "0") * 100)),
              freeShippingOverCents: String(Math.round(parseFloat(v.free || "0") * 100)),
              paymentInstructions: v.paymentInstructions,
            });
            utils.site.settings.invalidate();
            toast.success("Saved");
          } catch (e2) {
            err(e2);
          }
        }}
      >
        <h2 className="font-display text-3xl md:col-span-2">Store & contact</h2>
        <Field label="Company"><Input name="company" defaultValue={s.company} /></Field>
        <Field label="Contact email" hint="Shown on the site; staff notifications go here"><Input name="email" type="email" defaultValue={s.email} /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={s.phone} /></Field>
        <Field label="Instagram (@handle or URL)"><Input name="instagram" defaultValue={s.instagram} /></Field>
        <Field label="Address" className="md:col-span-2"><Input name="address" defaultValue={s.address} /></Field>
        <Field label="Retail shipping $"><Input name="ship" type="number" step="0.01" min="0" defaultValue={(Number(s.retailShippingCents) / 100).toFixed(2)} /></Field>
        <Field label="Free shipping over $" hint="0 = never free"><Input name="free" type="number" step="0.01" min="0" defaultValue={(Number(s.freeShippingOverCents) / 100).toFixed(2)} /></Field>
        <Field label="Payment instructions" hint="Shown at checkout, on the confirmation and in the email" className="md:col-span-2">
          <Textarea name="paymentInstructions" defaultValue={s.paymentInstructions} />
        </Field>
        <button type="submit" className="btn btn-spray md:col-span-2 md:w-fit" disabled={save.isPending}>Save settings</button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border-2 border-white/10 p-6">
          <h2 className="font-display text-3xl">Admins</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {admins?.map(a => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>{a.email} {a.name && <span className="text-smoke">({a.name})</span>}</span>
                {a.id !== me?.id && (
                  <button type="button" className="text-smoke hover:text-blood" onClick={async () => { if (confirm(`Remove ${a.email}?`)) { await remove.mutateAsync({ id: a.id }); utils.adminAuth.listAdmins.invalidate(); } }}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async e => {
              e.preventDefault();
              const form = e.currentTarget;
              const v = formObject(form);
              try {
                await create.mutateAsync({ email: v.email, password: v.password, name: v.name || undefined });
                form.reset();
                utils.adminAuth.listAdmins.invalidate();
                toast.success("Admin added");
              } catch (e2) {
                err(e2);
              }
            }}
          >
            <Input name="name" placeholder="Name" />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password (8+)" minLength={8} required />
            <button type="submit" className="btn btn-ghost">Add admin</button>
          </form>
        </div>
        <form
          className="h-fit border-2 border-white/10 p-6"
          onSubmit={async e => {
            e.preventDefault();
            const form = e.currentTarget;
            const v = formObject(form);
            try {
              await pw.mutateAsync({ current: v.current, next: v.next });
              form.reset();
              toast.success("Password changed");
            } catch (e2) {
              err(e2);
            }
          }}
        >
          <h2 className="font-display text-3xl">Your password</h2>
          <div className="mt-4 grid gap-3">
            <Input name="current" type="password" placeholder="Current password" required autoComplete="current-password" />
            <Input name="next" type="password" placeholder="New password (8+)" minLength={8} required autoComplete="new-password" />
            <button type="submit" className="btn btn-ghost">Change password</button>
          </div>
        </form>
      </div>
    </>
  );
}
