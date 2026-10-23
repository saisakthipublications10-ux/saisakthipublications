import "server-only";
import { NextRequest } from "next/server";
import { db } from "./firebase-admin";
import { HttpError } from "./api";

/** CSRF defence for cookie-authenticated POST/DELETE: Origin must match Host. */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  let ok = false;
  try { ok = !!origin && !!host && new URL(origin).host === host; } catch { /* invalid origin */ }
  if (!ok) throw new HttpError(403, "Invalid request origin");
}

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

/** Fixed-window limiter stored in Firestore (works across serverless instances). */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const win = Math.floor(Date.now() / (windowSec * 1000));
  const ref = db.collection("rateLimits").doc(`${key}:${win}`.replace(/\//g, "_"));
  const count = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const n = ((snap.data()?.count as number) ?? 0) + 1;
    tx.set(ref, { count: n, expiresAt: new Date((win + 1) * windowSec * 1000 + 60_000) });
    return n;
  });
  if (count > limit) throw new HttpError(429, "Too many requests. Please try again shortly.");
}