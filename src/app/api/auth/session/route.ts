import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db } from "@/lib/firebase-admin";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, clientIp, rateLimit } from "@/lib/security";

const body = z.object({ idToken: z.string().min(100).max(4000) });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  await rateLimit(`session:${clientIp(req)}`, 20, 600);
  const { idToken } = body.parse(await req.json());

  const decoded = await adminAuth.verifyIdToken(idToken, true).catch(() => {
    throw new HttpError(401, "Sign-in could not be verified");
  });
  // Only mint a cookie for a very recent sign-in
  if (Date.now() / 1000 - decoded.auth_time > 300) throw new HttpError(401, "Please sign in again");

  const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE * 1000 });
  cookies().set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  // Attach earlier guest bookings, but only for a verified email address
  if (decoded.email_verified && decoded.email) {
    try {
      const guest = await db.collection("bookings")
        .where("customerEmail", "==", decoded.email.toLowerCase())
        .where("customerId", "==", null)
        .limit(50).get();
      if (!guest.empty) {
        const batch = db.batch();
        guest.docs.forEach((d) =>
          batch.update(d.ref, { customerId: decoded.uid, updatedAt: FieldValue.serverTimestamp() }));
        await batch.commit();
      }
    } catch { /* never block sign-in on this */ }
  }
  return ok({ uid: decoded.uid });
});

export const DELETE = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  cookies().delete(SESSION_COOKIE);
  return ok({ signedOut: true });
});