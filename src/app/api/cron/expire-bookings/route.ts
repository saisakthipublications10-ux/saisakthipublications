import { Timestamp } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cutoff = Timestamp.fromMillis(Date.now() - 2 * 24 * 3600 * 1000);
  const oldUploads = await db.collection("epaperUploads")
    .where("createdAt", "<", cutoff)
    .limit(200)
    .get();

  let deleted = 0;
  for (const upload of oldUploads.docs) {
    const data = upload.data();
    if (data.status === "attached") continue;
    if (typeof data.path !== "string" || !data.path) {
      throw new Error(`E-Paper upload ${upload.id} has no storage path`);
    }

    await storage.bucket().file(data.path).delete({ ignoreNotFound: true });
    await upload.ref.delete();
    deleted += 1;
  }

  return Response.json({ deleted });
}
