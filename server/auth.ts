import { ADMIN_COOKIE_NAME, THIRTY_DAYS_MS, WHOLESALE_COOKIE_NAME } from "@shared/const";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

/**
 * Sessions for both kinds of account (admin, wholesale buyer). Each is a
 * signed JWT in its own httpOnly cookie; the `kind` claim stops a wholesale
 * token being replayed against admin procedures.
 */

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

function getSecret() {
  if (!ENV.cookieSecret && ENV.isProduction) {
    console.warn("[auth] JWT_SECRET is not set: sessions use an insecure default.");
  }
  return new TextEncoder().encode(ENV.cookieSecret || "krunkd-dev-secret-change-me");
}

export type SessionKind = "admin" | "wholesale";
export type SessionPayload = { sub: number; kind: SessionKind; email: string };

export async function signSession(payload: SessionPayload, expiresInMs = THIRTY_DAYS_MS) {
  return new SignJWT({ sub: String(payload.sub), kind: payload.kind, email: payload.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined | null,
  expected: SessionKind
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const sub = Number(payload.sub);
    if (!Number.isFinite(sub) || payload.kind !== expected || !payload.email) return null;
    return { sub, kind: expected, email: String(payload.email) };
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string) {
  return parseCookieHeader(req.headers.cookie ?? "")[name];
}

export const getAdminToken = (req: Request) => readCookie(req, ADMIN_COOKIE_NAME);
export const getWholesaleToken = (req: Request) => readCookie(req, WHOLESALE_COOKIE_NAME);

export function cookieOptions(req: Request) {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] || req.protocol;
  const secure = proto === "https";
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: THIRTY_DAYS_MS,
  };
}
