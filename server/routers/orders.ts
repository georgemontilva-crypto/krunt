import { flavorByKey, ORDER_STATUSES, RETAIL_MAX_QTY } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { customAlphabet, nanoid } from "nanoid";
import { z } from "zod";
import { adminProc, publicProc, resolveWholesale, router } from "../appTrpc";
import * as db from "../db";
import { mailOrderPlaced, mailOrderStatus } from "../mailer";
import { rateLimit, siteOrigin } from "../util";

const orderCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);
const str = (max: number) => z.string().trim().min(1).max(max);
const orderLink = (origin: string, o: { number: string; accessKey: string }) =>
  `${origin}/order/${o.number}?k=${o.accessKey}`;

/**
 * Checkout with no payment gateway yet: the order is stored as
 * "pending_payment" and the team sends a payment link. Every price is
 * recomputed here from the database; the cart only sends ids and quantities.
 */
export const ordersRouter = router({
  place: publicProc
    .input(
      z.object({
        items: z
          .array(z.object({ variantId: z.number().int(), quantity: z.number().int().min(1).max(10_000) }))
          .min(1)
          .max(60),
        customerName: str(255),
        email: z.string().trim().email(),
        phone: str(64),
        businessName: z.string().trim().max(255).optional(),
        address: str(255),
        address2: z.string().trim().max(255).optional(),
        city: str(120),
        state: str(64),
        zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
        notes: z.string().trim().max(2000).optional(),
        ageConfirmed: z.literal(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "order", 12, 60 * 60_000);
      const account = await resolveWholesale(ctx);
      const wholesale = account?.status === "approved";

      // Merge repeated lines for the same variant.
      const qty = new Map<number, number>();
      for (const i of input.items) qty.set(i.variantId, (qty.get(i.variantId) ?? 0) + i.quantity);

      const variants = await db.getVariantsByIds([...qty.keys()]);
      const catalog = await db.listCatalog({ publishedOnly: true });
      const items: db.NewOrderItem[] = [];
      for (const [variantId, quantity] of qty) {
        const v = variants.find(x => x.id === variantId);
        const p = v && catalog.find(c => c.id === v.productId);
        if (!v || !p) throw new TRPCError({ code: "BAD_REQUEST", message: "An item in your cart is no longer available" });
        const flavor = flavorByKey(v.flavorKey);
        if (!v.inStock) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${p.shortName} ${flavor.name} is sold out right now` });
        }
        if (wholesale) {
          if (quantity % p.caseSize !== 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `${p.shortName} ${flavor.name}: wholesale ships in cases of ${p.caseSize}` });
          }
        } else if (quantity > RETAIL_MAX_QTY) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Max ${RETAIL_MAX_QTY} per flavor on retail orders. Need more? Apply for wholesale.` });
        }
        const unit = wholesale ? p.wholesalePriceCents : p.retailPriceCents;
        items.push({
          productId: p.id,
          variantId: v.id,
          productName: p.shortName,
          flavorName: flavor.name,
          unitPriceCents: unit,
          quantity,
          lineTotalCents: unit * quantity,
        });
      }

      const settings = await db.getSettings();
      const subtotal = items.reduce((s, i) => s + i.lineTotalCents, 0);
      const freeOver = Number(settings.freeShippingOverCents) || 0;
      const flat = Number(settings.retailShippingCents) || 0;
      const shipping = wholesale ? 0 : freeOver > 0 && subtotal >= freeOver ? 0 : flat;

      let number = `KRK-${orderCode()}`;
      for (let i = 0; i < 5 && (await db.orderNumberExists(number)); i++) number = `KRK-${orderCode()}`;

      const order = await db.createOrder(
        {
          number,
          accessKey: nanoid(24),
          channel: wholesale ? "wholesale" : "retail",
          wholesaleAccountId: wholesale ? account!.id : null,
          customerName: input.customerName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          businessName: (wholesale ? account!.businessName : input.businessName) || null,
          address: input.address,
          address2: input.address2 || null,
          city: input.city,
          state: input.state,
          zip: input.zip,
          notes: input.notes || null,
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: subtotal + shipping,
        },
        items
      );

      void mailOrderPlaced(
        { ...order, items },
        settings.email,
        settings.paymentInstructions,
        orderLink(siteOrigin(ctx.req), order)
      );
      return { number: order.number, accessKey: order.accessKey };
    }),

  /** Confirmation page. The access key from the link is required. */
  get: publicProc
    .input(z.object({ number: z.string().max(32), key: z.string().max(64) }))
    .query(async ({ input }) => {
      const o = await db.getOrderByNumber(input.number);
      if (!o || o.accessKey !== input.key) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      const { adminNotes: _a, accessKey: _k, ...rest } = o;
      return rest;
    }),

  /* ─── Admin ───────────────────────────────────────────────────────────── */

  adminList: adminProc
    .input(
      z.object({
        status: z.enum(ORDER_STATUSES).optional(),
        channel: z.enum(["retail", "wholesale"]).optional(),
        search: z.string().max(100).optional(),
        page: z.number().int().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      const limit = 25;
      return db.listOrders({ ...input, search: input.search || undefined, limit, offset: (input.page - 1) * limit });
    }),

  adminGet: adminProc.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const o = await db.getOrderById(input.id);
    if (!o) throw new TRPCError({ code: "NOT_FOUND" });
    return o;
  }),

  adminUpdate: adminProc
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(ORDER_STATUSES).optional(),
        trackingNumber: z.string().trim().max(120).nullable().optional(),
        adminNotes: z.string().max(5000).nullable().optional(),
        notifyCustomer: z.boolean().default(false),
      })
    )
    .mutation(async ({ input: { id, notifyCustomer, ...data }, ctx }) => {
      const o = await db.updateOrder(id, data);
      if (!o) throw new TRPCError({ code: "NOT_FOUND" });
      if (notifyCustomer && data.status) {
        const settings = await db.getSettings();
        void mailOrderStatus(o, settings.email, orderLink(siteOrigin(ctx.req), o));
      }
      return o;
    }),
});
