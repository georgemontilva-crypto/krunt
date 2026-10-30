import {
  DEFAULT_SETTINGS,
  FLAVORS,
  SEED_PRODUCTS,
  SETTING_KEYS,
  type OrderStatus,
  type SiteSettings,
  type WholesaleStatus,
} from "@shared/const";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminUsers,
  contactMessages,
  orderItems,
  orders,
  productVariants,
  products,
  siteSettings,
  wholesaleAccounts,
  type InsertAdminUser,
  type InsertContactMessage,
  type InsertOrder,
  type InsertProduct,
  type InsertWholesaleAccount,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (err) {
      console.warn("[db] connection failed:", err);
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

const countOf = async (q: Promise<{ c: number }[]>) => Number((await q)[0]?.c ?? 0);

/* ─── Seed ───────────────────────────────────────────────────────────────── */

/**
 * Writes the three product lines and their six flavours into an empty
 * catalogue. Runs on every boot but only ever inserts what is missing, so it
 * never overwrites prices an admin has changed.
 */
export async function seedCatalog() {
  const db = await getDb();
  if (!db) return;
  try {
    for (const p of SEED_PRODUCTS) {
      let row = await getProductBySlug(p.slug);
      if (!row) {
        await db.insert(products).values(p);
        row = await getProductBySlug(p.slug);
        console.log(`[seed] product ${p.slug}`);
      }
      if (!row) continue;
      const existing = await db
        .select({ flavorKey: productVariants.flavorKey })
        .from(productVariants)
        .where(eq(productVariants.productId, row.id));
      const have = new Set(existing.map(e => e.flavorKey));
      const missing = FLAVORS.map((f, i) => ({ flavorKey: f.key, sortOrder: i })).filter(
        f => !have.has(f.flavorKey)
      );
      if (missing.length) {
        await db.insert(productVariants).values(missing.map(m => ({ ...m, productId: row!.id })));
      }
    }
  } catch (err) {
    console.error("[seed] failed:", err);
  }
}

/* ─── Admins ─────────────────────────────────────────────────────────────── */

export const countAdmins = async () =>
  countOf((await requireDb()).select({ c: sql<number>`count(*)` }).from(adminUsers));

export async function createAdmin(data: InsertAdminUser) {
  await (await requireDb()).insert(adminUsers).values(data);
}

export async function getAdminByEmail(email: string) {
  const rows = await (await requireDb()).select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getAdminById(id: number) {
  const rows = await (await requireDb()).select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAdmins() {
  return (await requireDb())
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      createdAt: adminUsers.createdAt,
      lastSignedIn: adminUsers.lastSignedIn,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.id));
}

export async function touchAdmin(id: number) {
  await (await requireDb()).update(adminUsers).set({ lastSignedIn: new Date() }).where(eq(adminUsers.id, id));
}

export async function setAdminPassword(id: number, passwordHash: string) {
  await (await requireDb()).update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
}

export async function deleteAdmin(id: number) {
  await (await requireDb()).delete(adminUsers).where(eq(adminUsers.id, id));
}

/* ─── Catalogue ──────────────────────────────────────────────────────────── */

export async function getProductBySlug(slug: string) {
  const rows = await (await requireDb()).select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProductById(id: number) {
  const rows = await (await requireDb()).select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Products with their flavour variants nested, in display order. */
export async function listCatalog(opts: { publishedOnly?: boolean } = {}) {
  const db = await requireDb();
  const prods = await (opts.publishedOnly
    ? db.select().from(products).where(eq(products.published, true))
    : db.select().from(products)
  ).orderBy(asc(products.sortOrder), asc(products.id));
  const vars = await db.select().from(productVariants).orderBy(asc(productVariants.sortOrder));
  return prods.map(p => ({ ...p, variants: vars.filter(v => v.productId === p.id) }));
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await requireDb();
  if (Object.keys(data).length) await db.update(products).set(data).where(eq(products.id, id));
  return getProductById(id);
}

export async function setVariantStock(id: number, inStock: boolean) {
  await (await requireDb()).update(productVariants).set({ inStock }).where(eq(productVariants.id, id));
}

export async function getVariantsByIds(ids: number[]) {
  if (!ids.length) return [];
  return (await requireDb()).select().from(productVariants).where(inArray(productVariants.id, ids));
}

/* ─── Wholesale accounts ─────────────────────────────────────────────────── */

export async function createWholesale(data: InsertWholesaleAccount) {
  await (await requireDb()).insert(wholesaleAccounts).values(data);
  return getWholesaleByEmail(data.email);
}

export async function getWholesaleByEmail(email: string) {
  const rows = await (await requireDb())
    .select()
    .from(wholesaleAccounts)
    .where(eq(wholesaleAccounts.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWholesaleById(id: number) {
  const rows = await (await requireDb())
    .select()
    .from(wholesaleAccounts)
    .where(eq(wholesaleAccounts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listWholesale(status?: WholesaleStatus) {
  const db = await requireDb();
  const base = db.select().from(wholesaleAccounts);
  return (status ? base.where(eq(wholesaleAccounts.status, status)) : base).orderBy(
    desc(wholesaleAccounts.id)
  );
}

export async function setWholesaleStatus(id: number, status: WholesaleStatus) {
  await (await requireDb())
    .update(wholesaleAccounts)
    .set({ status, reviewedAt: new Date() })
    .where(eq(wholesaleAccounts.id, id));
  return getWholesaleById(id);
}

export async function touchWholesale(id: number) {
  await (await requireDb())
    .update(wholesaleAccounts)
    .set({ lastSignedIn: new Date() })
    .where(eq(wholesaleAccounts.id, id));
}

export async function deleteWholesale(id: number) {
  await (await requireDb()).delete(wholesaleAccounts).where(eq(wholesaleAccounts.id, id));
}

/* ─── Orders ─────────────────────────────────────────────────────────────── */

export type NewOrderItem = {
  productId: number;
  variantId: number;
  productName: string;
  flavorName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export async function createOrder(order: InsertOrder, items: NewOrderItem[]) {
  const db = await requireDb();
  return db.transaction(async tx => {
    await tx.insert(orders).values(order);
    const [row] = await tx.select().from(orders).where(eq(orders.number, order.number)).limit(1);
    await tx.insert(orderItems).values(items.map(i => ({ ...i, orderId: row.id })));
    return row;
  });
}

export async function getOrderByNumber(number: string) {
  const db = await requireDb();
  const [row] = await db.select().from(orders).where(eq(orders.number, number)).limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
  return { ...row, items };
}

export async function getOrderById(id: number) {
  const db = await requireDb();
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
  return { ...row, items };
}

export async function orderNumberExists(number: string) {
  return (
    (await countOf(
      (await requireDb()).select({ c: sql<number>`count(*)` }).from(orders).where(eq(orders.number, number))
    )) > 0
  );
}

export async function listOrders(opts: {
  status?: OrderStatus;
  channel?: "retail" | "wholesale";
  search?: string;
  wholesaleAccountId?: number;
  limit: number;
  offset: number;
}) {
  const db = await requireDb();
  const conds = [];
  if (opts.status) conds.push(eq(orders.status, opts.status));
  if (opts.channel) conds.push(eq(orders.channel, opts.channel));
  if (opts.wholesaleAccountId) conds.push(eq(orders.wholesaleAccountId, opts.wholesaleAccountId));
  if (opts.search) {
    const q = `%${opts.search}%`;
    conds.push(or(like(orders.number, q), like(orders.email, q), like(orders.customerName, q))!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.id)).limit(opts.limit).offset(opts.offset);
  const total = await countOf(db.select({ c: sql<number>`count(*)` }).from(orders).where(where));
  return { rows, total };
}

export async function updateOrder(
  id: number,
  data: { status?: OrderStatus; trackingNumber?: string | null; adminNotes?: string | null }
) {
  const db = await requireDb();
  if (Object.keys(data).length) await db.update(orders).set(data).where(eq(orders.id, id));
  return getOrderById(id);
}

/* ─── Contact ────────────────────────────────────────────────────────────── */

export async function createContactMessage(data: InsertContactMessage) {
  await (await requireDb()).insert(contactMessages).values(data);
}

export async function listContactMessages(opts: { limit: number; offset: number }) {
  const db = await requireDb();
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.id)).limit(opts.limit).offset(opts.offset);
  const total = await countOf(db.select({ c: sql<number>`count(*)` }).from(contactMessages));
  return { rows, total };
}

export async function setMessageHandled(id: number, handled: boolean) {
  await (await requireDb()).update(contactMessages).set({ handled }).where(eq(contactMessages.id, id));
}

export async function deleteMessage(id: number) {
  await (await requireDb()).delete(contactMessages).where(eq(contactMessages.id, id));
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */

export async function dashboardStats() {
  const db = await requireDb();
  const c = () => db.select({ c: sql<number>`count(*)` });
  const [awaitingPayment, toShip, pendingWholesale, openMessages, totalOrders] = await Promise.all([
    countOf(c().from(orders).where(eq(orders.status, "pending_payment"))),
    countOf(c().from(orders).where(inArray(orders.status, ["paid", "processing"]))),
    countOf(c().from(wholesaleAccounts).where(eq(wholesaleAccounts.status, "pending"))),
    countOf(c().from(contactMessages).where(eq(contactMessages.handled, false))),
    countOf(c().from(orders)),
  ]);
  const rev = await db
    .select({ s: sql<number>`coalesce(sum(${orders.totalCents}),0)` })
    .from(orders)
    .where(inArray(orders.status, ["paid", "processing", "shipped", "completed"]));
  const recent = await db.select().from(orders).orderBy(desc(orders.id)).limit(6);
  return {
    awaitingPayment,
    toShip,
    pendingWholesale,
    openMessages,
    totalOrders,
    paidRevenueCents: Number(rev[0]?.s ?? 0),
    recent,
  };
}

/* ─── Settings ───────────────────────────────────────────────────────────── */

export async function getSettings(): Promise<SiteSettings> {
  const out: SiteSettings = { ...DEFAULT_SETTINGS };
  const db = await getDb();
  if (!db) return out;
  try {
    const rows = await db.select().from(siteSettings);
    for (const r of rows) {
      if ((SETTING_KEYS as readonly string[]).includes(r.key) && r.value !== null) {
        out[r.key as keyof SiteSettings] = r.value;
      }
    }
  } catch (err) {
    console.warn("[db] settings unavailable:", err);
  }
  return out;
}

export async function setSetting(key: string, value: string) {
  await (await requireDb())
    .insert(siteSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
