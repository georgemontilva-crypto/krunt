import { CONTACT_TOPICS } from "@shared/const";
import { AnimatePresence, motion } from "motion/react";
import { AtSign, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/Brand";
import { PageHead } from "@/components/Bits";
import { Field, formObject, Input, Select, Textarea } from "@/components/Form";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const settings = trpc.site.settings.useQuery().data;
  const send = trpc.site.contact.useMutation();
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = formObject(e.currentTarget);
    try {
      await send.mutateAsync({
        name: v.name,
        email: v.email,
        phone: v.phone || undefined,
        topic: (v.topic || undefined) as (typeof CONTACT_TOPICS)[number] | undefined,
        message: v.message,
        website: v.website || undefined,
      });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send. Try again.");
    }
  };

  const cards = [
    settings?.email && { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings?.phone && { icon: Phone, label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` },
    settings?.instagram && { icon: AtSign, label: "Instagram", value: settings.instagram, href: settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace("@", "")}` },
    settings?.address && { icon: MapPin, label: "Address", value: settings.address },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHead kicker="Contact" title="Hit us up">
        <p className="mt-6 max-w-xl text-lg text-smoke">Questions, orders, wholesale, collabs, love letters. We read everything.</p>
      </PageHead>
      <section className="bg-ink px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {cards.map(c => (
              <a key={c.label} href={c.href} target={c.href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex items-center gap-4 border-2 border-white/10 p-5 transition hover:-rotate-1 hover:border-[var(--flavor)]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--flavor)] text-black">
                  <c.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="label block text-smoke">{c.label}</span>
                  <span className="block truncate text-lg font-bold">{c.value}</span>
                </span>
              </a>
            ))}
            <div className="relative overflow-hidden border-2 border-white/10 p-6">
              <Mark className="absolute -bottom-8 -right-6 w-36 rotate-12 opacity-20" />
              <p className="font-display text-4xl">Wholesale?</p>
              <p className="mt-2 max-w-xs text-smoke">Skip the line: apply for a wholesale account and order by the case online.</p>
              <a href="/wholesale" className="label mt-4 inline-block border-b-2 border-[var(--flavor)] text-[var(--flavor)]">Apply now →</a>
            </div>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="ok" initial={{ scale: 0.8, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} className="flex h-full min-h-96 flex-col items-center justify-center border-4 border-[var(--flavor)] p-10 text-center">
                  <Mark className="w-28 animate-wobble" />
                  <h2 className="font-display mt-6 text-6xl">Message sent.</h2>
                  <p className="mt-2 text-smoke">We'll get back to you soon. Stay krunk'd.</p>
                  <button type="button" className="btn btn-ghost mt-6" onClick={() => setSent(false)}>Send another</button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="grid gap-5 border-2 border-white/10 bg-wall p-6 md:grid-cols-2 md:p-10" exit={{ opacity: 0, y: -20 }}>
                  <Field label="Name *"><Input name="name" required maxLength={255} autoComplete="name" /></Field>
                  <Field label="Email *"><Input name="email" type="email" required autoComplete="email" /></Field>
                  <Field label="Phone"><Input name="phone" type="tel" autoComplete="tel" /></Field>
                  <Field label="Topic">
                    <Select name="topic" defaultValue="">
                      <option value="">Pick one</option>
                      {CONTACT_TOPICS.map(t => <option key={t}>{t}</option>)}
                    </Select>
                  </Field>
                  <Field label="Message *" className="md:col-span-2"><Textarea name="message" required minLength={5} maxLength={5000} /></Field>
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                  <div className="md:col-span-2">
                    <button type="submit" className="btn btn-spray w-full md:w-auto" disabled={send.isPending}>
                      <Send className="h-5 w-5" /> {send.isPending ? "Sending…" : "Send it"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}
