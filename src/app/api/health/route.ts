import { db, storage, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function envReport() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim().replace(/^["']|["']$/g, "");
  const r: Record<string, unknown> = {
    vercelEnv: process.env.VERCEL_ENV ?? "local",            // production | preview | development
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    base64Present: !!raw,
    base64Length: raw?.length ?? 0,
    oldPrivateKeyPresent: !!process.env.FIREBASE_PRIVATE_KEY,
    storageBucketPresent: !!process.env.FIREBASE_STORAGE_BUCKET,
    razorpayKeyPresent: !!process.env.RAZORPAY_KEY_ID,
  };
  if (raw) {
    try {
      const j = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
      r.projectId = j.project_id ?? null;
      r.hasClientEmail = !!j.client_email;
      r.hasPrivateKey = !!j.private_key;
      r.keyLooksRight = String(j.private_key ?? "").includes("BEGIN PRIVATE KEY");
    } catch {
      r.decodeError = "value is not valid base64 JSON";
    }
  }
  return r;
}

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("env")) return Response.json(envReport());

  const checks: Record<string, string> = {};
  try { await db.collection("locations").limit(1).get(); checks.firestore = "ok"; }
  catch (e) { checks.firestore = (e as Error).message.slice(0, 160); }
  try { await adminAuth.listUsers(1); checks.auth = "ok"; }
  catch (e) { checks.auth = (e as Error).message.slice(0, 160); }
  try { const [x] = await storage.bucket().exists(); checks.storage = x ? "ok" : "bucket not found"; }
  catch (e) { checks.storage = (e as Error).message.slice(0, 160); }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return Response.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}