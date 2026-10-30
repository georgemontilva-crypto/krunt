import { ADMIN_COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { cookieOptions, hashPassword, signSession, verifyPassword } from "../auth";
import { adminProc, publicProc, router } from "../appTrpc";
import * as db from "../db";
import { rateLimit } from "../util";

/**
 * The first admin can only be created with ADMIN_SETUP_TOKEN, so nobody can
 * claim an empty admin panel on a fresh deploy. Remove the variable after.
 */
const SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN ?? "";

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export const adminAuthRouter = router({
  setupStatus: publicProc.query(async () => ({
    needsSetup: (await db.countAdmins()) === 0,
    setupEnabled: SETUP_TOKEN.length > 0,
  })),

  setup: publicProc
    .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().max(255).optional(), setupToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "admin-setup", 10, 15 * 60_000);
      if (!SETUP_TOKEN) throw new TRPCError({ code: "FORBIDDEN", message: "Set ADMIN_SETUP_TOKEN on the server first" });
      if ((await db.countAdmins()) > 0) throw new TRPCError({ code: "FORBIDDEN", message: "Admin already configured" });
      if (!safeEqual(input.setupToken, SETUP_TOKEN)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid setup token" });
      const email = input.email.toLowerCase();
      await db.createAdmin({ email, passwordHash: await hashPassword(input.password), name: input.name ?? null });
      const admin = await db.getAdminByEmail(email);
      if (!admin) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      ctx.res.cookie(ADMIN_COOKIE_NAME, await signSession({ sub: admin.id, kind: "admin", email }), cookieOptions(ctx.req));
      return { success: true };
    }),

  login: publicProc
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "admin-login", 20, 15 * 60_000);
      const admin = await db.getAdminByEmail(input.email.toLowerCase());
      if (!admin || !(await verifyPassword(input.password, admin.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      await db.touchAdmin(admin.id);
      ctx.res.cookie(ADMIN_COOKIE_NAME, await signSession({ sub: admin.id, kind: "admin", email: admin.email }), cookieOptions(ctx.req));
      return { success: true };
    }),

  me: adminProc.query(({ ctx }) => ({ id: ctx.admin.id, email: ctx.admin.email, name: ctx.admin.name })),

  logout: publicProc.mutation(({ ctx }) => {
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions(ctx.req), maxAge: undefined });
    return { success: true };
  }),

  listAdmins: adminProc.query(() => db.listAdmins()),

  createAdmin: adminProc
    .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().max(255).optional() }))
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase();
      if (await db.getAdminByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "That email already has an admin account" });
      await db.createAdmin({ email, passwordHash: await hashPassword(input.password), name: input.name || null });
      return { success: true };
    }),

  deleteAdmin: adminProc.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
    if (input.id === ctx.admin.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You can't delete your own account" });
    await db.deleteAdmin(input.id);
    return { success: true };
  }),

  changePassword: adminProc
    .input(z.object({ current: z.string().min(1), next: z.string().min(8) }))
    .mutation(async ({ input, ctx }) => {
      if (!(await verifyPassword(input.current, ctx.admin.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is wrong" });
      }
      await db.setAdminPassword(ctx.admin.id, await hashPassword(input.next));
      return { success: true };
    }),
});
