/**
 * Transactional email through Resend. Optional: every order, application and
 * message is stored in the database and visible in the admin first, so when
 * the variables are missing these calls do nothing, and a failed send is only
 * logged.
 *
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL (sender on a verified domain).
 * NOTIFY_EMAIL overrides where staff notifications go (default: the contact
 * email set in the admin).
 */
import { formatMoney, ORDER_STATUS_LABEL, type OrderStatus } from "@shared/const";

const KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.RESEND_FROM_EMAIL ?? "";
const NOTIFY = process.env.NOTIFY_EMAIL ?? "";

export const isMailConfigured = () => Boolean(KEY && FROM);

async function send(to: string, subject: string, text: string, replyTo?: string) {
  if (!isMailConfigured() || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.warn(`[mailer] Resend ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.warn("[mailer] send failed:", err);
  }
}

const staff = (siteEmail: string) => NOTIFY || siteEmail;

type OrderForMail = {
  number: string;
  channel: string;
  customerName: string;
  email: string;
  phone: string;
  businessName: string | null;
  address: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: { productName: string; flavorName: string; quantity: number; lineTotalCents: number }[];
};

function orderBody(o: OrderForMail) {
  return [
    ...o.items.map(i => `${i.quantity} × ${i.productName} — ${i.flavorName}   ${formatMoney(i.lineTotalCents)}`),
    "",
    `Subtotal: ${formatMoney(o.subtotalCents)}`,
    `Shipping: ${o.shippingCents ? formatMoney(o.shippingCents) : o.channel === "wholesale" ? "Quoted with invoice" : "Free"}`,
    `Total: ${formatMoney(o.totalCents)}`,
    "",
    "Ship to:",
    o.businessName ?? "",
    o.customerName,
    o.address,
    o.address2 ?? "",
    `${o.city}, ${o.state} ${o.zip}`,
  ]
    .filter(l => l !== "")
    .join("\n");
}

export async function mailOrderPlaced(o: OrderForMail, siteEmail: string, paymentInstructions: string, link: string) {
  await send(
    o.email,
    `Krunk'd order ${o.number} received`,
    `Hey ${o.customerName.split(" ")[0]},\n\nWe got your order ${o.number}.\n\n${paymentInstructions}\n\n${orderBody(o)}\n\nTrack it here: ${link}\n\n— Krunk'd`,
    siteEmail || undefined
  );
  await send(
    staff(siteEmail),
    `New ${o.channel} order ${o.number} — ${formatMoney(o.totalCents)}`,
    `${o.customerName} <${o.email}> ${o.phone}\n\n${orderBody(o)}${o.notes ? `\n\nNotes: ${o.notes}` : ""}`,
    o.email
  );
}

export async function mailOrderStatus(o: { number: string; email: string; customerName: string; status: OrderStatus; trackingNumber: string | null }, siteEmail: string, link: string) {
  await send(
    o.email,
    `Krunk'd order ${o.number}: ${ORDER_STATUS_LABEL[o.status]}`,
    `Hey ${o.customerName.split(" ")[0]},\n\nYour order ${o.number} is now: ${ORDER_STATUS_LABEL[o.status]}.${o.trackingNumber ? `\nTracking: ${o.trackingNumber}` : ""}\n\nDetails: ${link}\n\n— Krunk'd`,
    siteEmail || undefined
  );
}

export async function mailWholesaleApplied(a: { businessName: string; contactName: string; email: string; phone: string; city: string; state: string }, siteEmail: string) {
  await send(
    staff(siteEmail),
    `Wholesale application: ${a.businessName}`,
    `${a.businessName}\n${a.contactName} <${a.email}> ${a.phone}\n${a.city}, ${a.state}\n\nReview it in the admin under Wholesale.`,
    a.email
  );
  await send(
    a.email,
    "Krunk'd wholesale application received",
    `Hey ${a.contactName.split(" ")[0]},\n\nThanks for applying for a Krunk'd wholesale account for ${a.businessName}. We review every application by hand and you'll get an email as soon as it's approved.\n\n— Krunk'd`,
    siteEmail || undefined
  );
}

export async function mailWholesaleApproved(a: { contactName: string; email: string; businessName: string }, siteEmail: string, link: string) {
  await send(
    a.email,
    "You're in: Krunk'd wholesale account approved",
    `Hey ${a.contactName.split(" ")[0]},\n\n${a.businessName} is approved for Krunk'd wholesale. Sign in to see case pricing and place orders: ${link}\n\n— Krunk'd`,
    siteEmail || undefined
  );
}

export async function mailContact(m: { name: string; email: string; phone: string | null; topic: string | null; message: string }, siteEmail: string) {
  await send(
    staff(siteEmail),
    `Krunk'd contact: ${m.topic ?? "New message"} — ${m.name}`,
    [`From: ${m.name} <${m.email}>`, m.phone ? `Phone: ${m.phone}` : "", m.topic ? `About: ${m.topic}` : "", "", m.message]
      .filter(Boolean)
      .join("\n"),
    m.email
  );
}
