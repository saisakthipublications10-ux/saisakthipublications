import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ok, fail, handleError } from "../../../lib/api";

export const dynamic = "force-dynamic";

// GET /api/catalog?newspaperId=omr-voice
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("newspaperId");
    if (!id) return fail("newspaperId is required", 422);

    const paper = await adminDb.collection("newspapers").doc(id).get();
    if (!paper.exists || !paper.data()!.active) return ok({ categories: [], formats: [] });

    const formatIds: string[] = paper.data()!.formatIds ?? [];
    const [cats, fmts] = await Promise.all([
      adminDb.collection("categories").where("active", "==", true).get(),
      Promise.all(formatIds.map((f) => adminDb.collection("formats").doc(f).get())),
    ]);

    return ok({
      categories: cats.docs.map((d) => ({ id: d.id, name: d.data().name })),
      formats: fmts
        .filter((d) => d.exists && d.data()!.active)
        .map((d) => ({ id: d.id, name: d.data()!.name, kind: d.data()!.kind })),
    });
  } catch (e) {
    return handleError(e);
  }
}