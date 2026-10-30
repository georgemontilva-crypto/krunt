import { WHOLESALE_COOKIE_NAME, WHOLESALE_STATUSES } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cookieOptions, hashPassword, signSession, verifyPassword } from "../auth";
import { adminProc, publicProc, resolveWholesale, router, wholesaleProc } from "../appTrpc";
import * as db from "../db";
import { mailWholesaleApplied, mailWholesaleApproved } from "../mailer";
import { rateLimit, siteOrigin } from "../util";

/** What the browser is allowed to see about its own account. */
function publicAccount(a: NonNullable<Awaited<ReturnType<typeof db.getWholesaleById>>>) {
  const { passwordHash: _p, notes: _n, ...rest } = a;
  return rest;
}

const str = (max: number) => z.string().trim().min(1).max(max);

export const wholesaleRouter = router({
  register: publicProc
    .input(
      z.object({
        businessName: str(255),
        contactName: str(255),
        email: z.string().trim().email(),
        phone: str(64),
        password: z.string().min(8).max(200),
        taxId: z.string().trim().max(120).optional(),
        website: z.string().trim().max(255).optional(),
        address: str(255),
        city: str(120),
        state: str(64),
        zip: str(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "wholesale-apply", 5, 60 * 60_000);
      const email = input.email.toLowerCase();
      if (await db.getWholesaleByEmail(email)) {
        throw new TRPCError({ code: "CONFLICT", message: "There's already an account with that email. Sign in instead." });
      }
      const { password, ...rest } = input;
      const account = await db.createWholesale({
        ...rest,
        email,
        taxId: input.taxId || null,
        website: input.website || null,
        passwordHash: await hashPassword(password),
      });
      if (!account) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      ctx.res.cookie(
        WHOLESALE_COOKIE_NAME,
        await signSession({ sub: account.id, kind: "wholesale", email }),
        cookieOptions(ctx.req)
      );
      const settings = await db.getSettings();
      void mailWholesaleApplied(account, settings.email);
      return publicAccount(account);
    }),

  login: publicProc
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "wholesale-login", 20, 15 * 60_000);
      const account = await db.getWholesaleByEmail(input.email.toLowerCase());
      if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      await db.touchWholesale(account.id);
      ctx.res.cookie(
        WHOLESALE_COOKIE_NAME,
        await signSession({ sub: account.id, kind: "wholesale", email: account.email }),
        cookieOptions(ctx.req)
      );
      return publicAccount(account);
    }),

  logout: publicProc.mutation(({ ctx }) => {
    ctx.res.clearCookie(WHOLESALE_COOKIE_NAME, { ...cookieOptions(ctx.req), maxAge: undefined });
    return { success: true };
  }),

  /** Null when signed out, rather than an error: the header asks on every page. */
  me: publicProc.query(async ({ ctx }) => {
    const a = await resolveWholesale(ctx);
    return a ? publicAccount(a) : null;
  }),

  myOrders: wholesaleProc.query(async ({ ctx }) => {
    const { rows } = await db.listOrders({ wholesaleAccountId: ctx.account.id, limit: 50, offset: 0 });
    return rows.map(o => ({
      number: o.number,
      accessKey: o.accessKey,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
    }));
  }),

  /* ─── Admin ───────────────────────────────────────────────────────────── */

  adminList: adminProc
    .input(z.object({ status: z.enum(WHOLESALE_STATUSES).optional() }).optional())
    .query(async ({ input }) => (await db.listWholesale(input?.status)).map(publicAccount)),

  setStatus: adminProc
    .input(z.object({ id: z.number().int(), status: z.enum(WHOLESALE_STATUSES) }))
    .mutation(async ({ input, ctx }) => {
      const before = await db.getWholesaleById(input.id);
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });
      const after = await db.setWholesaleStatus(input.id, input.status);
      if (after && input.status === "approved" && before.status !== "approved") {
        const settings = await db.getSettings();
        void mailWholesaleApproved(after, settings.email, `${siteOrigin(ctx.req)}/wholesale`);
      }
      return { success: true };
    }),

  delete: adminProc.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    await db.deleteWholesale(input.id);
    return { success: true };
  }),
});
