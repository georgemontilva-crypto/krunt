/** Session cookies. Admin and wholesale accounts never share a cookie. */
export const ADMIN_COOKIE_NAME = "krunkd_admin_session";
export const WHOLESALE_COOKIE_NAME = "krunkd_wholesale_session";
export const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export const BRAND_NAME = "Krunk'd";
export const BRAND_TAGLINE = "Get Krunk'd. Stay Legendary.";

/** Brand colours, sampled from the logo artwork. */
export const LIME = "#c4da45";
export const BLOOD = "#fe0308";

/* ─── Flavours ──────────────────────────────────────────────────────────────
   Every product comes in the same six. Each has the accent colour printed on
   its pack; the site recolours itself to it when the flavour is picked. */
export const FLAVORS = [
  {
    key: "bacio-gelato",
    name: "Bacio Gelato",
    color: "#ff5a1f",
    notes: "Creamy gelato, sweet orange zest, a soft dessert finish.",
  },
  {
    key: "big-nasty",
    name: "Big Nasty",
    color: "#ff2238",
    notes: "Heavy gas, red berries and a long, loud exhale.",
  },
  {
    key: "blue-skittles",
    name: "Blue Skittles",
    color: "#1fb4ff",
    notes: "Blue raspberry candy, tart and bright from start to finish.",
  },
  {
    key: "candy-gas",
    name: "Candy Gas",
    color: "#ff2fa4",
    notes: "Sugar-coated sweetness up front, fuel on the back end.",
  },
  {
    key: "king-louis",
    name: "King Louis",
    color: "#ffd21f",
    notes: "Pine, earth and lemon peel. Old-school royalty.",
  },
  {
    key: "paris-og",
    name: "Paris OG",
    color: "#9b3cff",
    notes: "Grape skin, spice and that classic OG funk.",
  },
] as const;

export type FlavorKey = (typeof FLAVORS)[number]["key"];
export const FLAVOR_KEYS = FLAVORS.map(f => f.key) as [FlavorKey, ...FlavorKey[]];

export function flavorByKey(key: string) {
  return FLAVORS.find(f => f.key === key) ?? FLAVORS[0];
}

/* ─── Product line ──────────────────────────────────────────────────────── */

export const PRODUCT_KINDS = ["disposable", "preroll-pack", "preroll-tube"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

/**
 * The catalogue that is written into an empty database on first boot. Prices
 * are starting points: the admin edits them under Products without a deploy.
 * Amounts are in cents.
 */
export const SEED_PRODUCTS: {
  slug: ProductKind;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  netWeight: string;
  retailPriceCents: number;
  wholesalePriceCents: number;
  caseSize: number;
  sortOrder: number;
}[] = [
  {
    slug: "disposable",
    name: "Disposable Premium Botanical Blend",
    shortName: "Disposable",
    tagline: "1 gram. Zero chill.",
    description:
      "A rechargeable, ready-to-go 1 g disposable filled with Krunk'd's premium botanical blend, infused with Blue Lotus. Pull-activated, no buttons, no setup: open the pouch and hit it.",
    netWeight: "1 gram (0.035 oz)",
    retailPriceCents: 2999,
    wholesalePriceCents: 1400,
    caseSize: 10,
    sortOrder: 1,
  },
  {
    slug: "preroll-pack",
    name: "Premium Botanical Pre-Rolls 2 Pack",
    shortName: "Pre-Roll 2 Pack",
    tagline: "Two cones. Double trouble.",
    description:
      "Two hand-finished 1.5 g pre-rolls packed with indoor-grown botanicals and infused with Blue Lotus. Branded Krunk'd crutch, tight even burn, sealed in a smell-proof pouch.",
    netWeight: "2 × 1.5 grams (3 grams total)",
    retailPriceCents: 2499,
    wholesalePriceCents: 1100,
    caseSize: 10,
    sortOrder: 2,
  },
  {
    slug: "preroll-tube",
    name: "Premium Botanical Pre-Roll Tube",
    shortName: "Pre-Roll Tube",
    tagline: "One tube. Pocket-sized mayhem.",
    description:
      "A single 1.5 g premium botanical pre-roll in a crush-proof, child-resistant tube. Blue Lotus infused, built to ride in your pocket until the moment hits.",
    netWeight: "1 × 1.5 grams (1.5 grams total)",
    retailPriceCents: 1499,
    wholesalePriceCents: 650,
    caseSize: 20,
    sortOrder: 3,
  },
];

/* ─── Orders ────────────────────────────────────────────────────────────── */

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const WHOLESALE_STATUSES = ["pending", "approved", "rejected"] as const;
export type WholesaleStatus = (typeof WHOLESALE_STATUSES)[number];

/** Retail buyers can't order more than this of one flavour in one order. */
export const RETAIL_MAX_QTY = 20;

/* ─── Site settings ─────────────────────────────────────────────────────── */

export const DEFAULT_SETTINGS = {
  company: "Krunk'd",
  email: "hello@krunkd.com",
  phone: "",
  address: "",
  instagram: "",
  /** Flat retail shipping, in cents. */
  retailShippingCents: "795",
  /** Retail orders at or above this subtotal ship free, in cents. 0 = never. */
  freeShippingOverCents: "7500",
  /** Shown on the order confirmation and in the email, while there is no gateway. */
  paymentInstructions:
    "No payment has been taken yet. Our team will reach out within one business day with a secure payment link to complete your order.",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as [SettingKey, ...SettingKey[]];
export type SiteSettings = Record<SettingKey, string>;

export const CONTACT_TOPICS = [
  "Product question",
  "Order",
  "Wholesale",
  "Something else",
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
