import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in"),
});
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/** The three product lines. Prices are in cents. */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 120 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  netWeight: varchar("net_weight", { length: 120 }),
  retailPriceCents: int("retail_price_cents").notNull(),
  wholesalePriceCents: int("wholesale_price_cents").notNull(),
  /** Wholesale buyers order in multiples of this. */
  caseSize: int("case_size").notNull().default(10),
  published: boolean("published").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/** One row per product × flavour, so a flavour can sell out on one line only. */
export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id").notNull(),
    flavorKey: varchar("flavor_key", { length: 64 }).notNull(),
    inStock: boolean("in_stock").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
  },
  t => [uniqueIndex("variant_product_flavor").on(t.productId, t.flavorKey)]
);
export type ProductVariant = typeof productVariants.$inferSelect;

export const wholesaleAccounts = mysqlTable("wholesale_accounts", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 64 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  taxId: varchar("tax_id", { length: 120 }),
  website: varchar("website", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 64 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  lastSignedIn: timestamp("last_signed_in"),
});
export type WholesaleAccount = typeof wholesaleAccounts.$inferSelect;
export type InsertWholesaleAccount = typeof wholesaleAccounts.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 32 }).notNull().unique(),
  /** Secret part of the confirmation link, so order numbers can't be walked. */
  accessKey: varchar("access_key", { length: 64 }).notNull(),
  channel: mysqlEnum("channel", ["retail", "wholesale"]).notNull(),
  wholesaleAccountId: int("wholesale_account_id"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 64 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  notes: text("notes"),
  subtotalCents: int("subtotal_cents").notNull(),
  shippingCents: int("shipping_cents").notNull(),
  totalCents: int("total_cents").notNull(),
  status: mysqlEnum("status", [
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ])
    .notNull()
    .default("pending_payment"),
  trackingNumber: varchar("tracking_number", { length: 120 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull(),
  productId: int("product_id").notNull(),
  variantId: int("variant_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  flavorName: varchar("flavor_name", { length: 120 }).notNull(),
  unitPriceCents: int("unit_price_cents").notNull(),
  quantity: int("quantity").notNull(),
  lineTotalCents: int("line_total_cents").notNull(),
});
export type OrderItem = typeof orderItems.$inferSelect;

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  topic: varchar("topic", { length: 120 }),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export const siteSettings = mysqlTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value"),
});
