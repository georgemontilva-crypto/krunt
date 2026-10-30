import { TRPCError } from "@trpc/server";
import type { Request } from "express";

/** Public origin of the site, for links in emails. */
export function siteOrigin(req: Request) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) || req.headers.host;
  return `${proto}://${host}`;
}

/**
 * Small in-memory rate limit for the public forms. One container, so memory
 * is enough; it only has to stop a script from flooding the inbox.
 */
const hits = new Map<string, number[]>();
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number) {
  const key = `${bucket}:${req.ip}`;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (list.length >= max) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again in a few minutes." });
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
}
