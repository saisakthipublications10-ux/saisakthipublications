import { db } from "@/lib/firebase-admin";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await db.collection("locations").where("active", "==", true).get();
    const locations = snap.docs
      .map((d) => ({ id: d.id, name: d.data().name as string }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok(locations);
  } catch (e) {
    return handleError(e);
  }
}