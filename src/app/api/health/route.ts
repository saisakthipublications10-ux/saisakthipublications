import { db, storage, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  try { await db.collection("locations").limit(1).get(); checks.firestore = "ok"; }
  catch (e) { checks.firestore = (e as Error).message.slice(0, 160); }

  try { await adminAuth.listUsers(1); checks.auth = "ok"; }
  catch (e) { checks.auth = (e as Error).message.slice(0, 160); }

  try {
    const [exists] = await storage.bucket().exists();
    checks.storage = exists ? "ok" : "bucket not found";
  } catch (e) { checks.storage = (e as Error).message.slice(0, 160); }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return Response.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}