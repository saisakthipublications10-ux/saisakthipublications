import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./firebase-admin";
import { HttpError } from "./api";

export const SESSION_COOKIE = "__nt_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
  role: "customer" | "admin";
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const d = await adminAuth.verifySessionCookie(cookie, true); // true = check revocation
    return {
      uid: d.uid,
      email: d.email ?? null,
      name: (d.name as string | undefined) ?? null,
      emailVerified: !!d.email_verified,
      role: d.role === "admin" ? "admin" : "customer",
    };
  } catch {
    return null;
  }
});

export async function requireUser(next: string) {
  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireApiUser() {
  const user = await getSession();
  if (!user) throw new HttpError(401, "Please sign in to continue");
  return user;
}

export async function requireAdmin(next: string) {
  const user = await requireUser(next);
  if (user.role !== "admin") redirect("/dashboard"); // customers never see admin pages
  return user;
}