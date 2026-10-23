import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { db } from "./firebase-admin";
import { getSession, type SessionUser } from "./auth";
import { HttpError } from "./api";
import type { Result } from "./admin-types";

export async function requireAdminAction() {
  const u = await getSession();
  if (!u || u.role !== "admin") throw new HttpError(403, "Admin access required");
  return u;
}

export async function audit(admin: SessionUser, action: string, target: string, meta: Record<string, unknown> = {}) {
  await db.collection("auditLogs").add({
    actor: admin.uid, actorEmail: admin.email, action, target, meta, at: FieldValue.serverTimestamp(),
  });
}

/** Runs an admin mutation: checks the role, turns errors into a Result, refreshes admin pages. */
export async function run(fn: (admin: SessionUser) => Promise<string>): Promise<Result> {
  try {
    const admin = await requireAdminAction();
    const message = await fn(admin);
    revalidatePath("/admin", "layout");
    return { ok: true, message };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, message: e.message };
    if (e instanceof ZodError) return { ok: false, message: e.issues[0]?.message ?? "Invalid input" };
    console.error("[admin]", e instanceof Error ? e.message : "unknown error");
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const bool = (fd: FormData, k: string) => fd.get(k) === "on";
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);