import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./_core/context";
import { getAdminToken, getWholesaleToken, verifySession } from "./auth";
import * as db from "./db";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProc = t.procedure;

/** Resolves the wholesale cookie if there is one; never throws. */
export async function resolveWholesale(ctx: TrpcContext) {
  const session = await verifySession(getWholesaleToken(ctx.req), "wholesale");
  if (!session) return null;
  return db.getWholesaleById(session.sub);
}

export const adminProc = t.procedure.use(async ({ ctx, next }) => {
  const session = await verifySession(getAdminToken(ctx.req), "admin");
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin sign-in required" });
  const admin = await db.getAdminById(session.sub);
  if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin not found" });
  return next({ ctx: { ...ctx, admin } });
});

export const wholesaleProc = t.procedure.use(async ({ ctx, next }) => {
  const account = await resolveWholesale(ctx);
  if (!account) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to your wholesale account" });
  return next({ ctx: { ...ctx, account } });
});
