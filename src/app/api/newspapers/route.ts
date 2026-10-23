import { NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { ok, fail, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get("locationId");
    if (!locationId) return fail("locationId is required", 422);

    // Single-field query: no composite index needed. "active" is checked below.
    const mapSnap = await db.collection("newspaperLocations").where("locationId", "==", locationId).get();
    const mappings = mapSnap.docs.map((d) => ({
      docId: d.id,
      newspaperId: d.data().newspaperId as string | undefined,
      active: d.data().active === true,
    }));

    const paperDocs = await Promise.all(
      mappings.map((m) => (m.newspaperId ? db.collection("newspapers").doc(m.newspaperId).get() : null)),
    );

    const papers: { id: string; name: string }[] = [];
    const skipped: { mapping: string; reason: string }[] = [];
    mappings.forEach((m, i) => {
      const doc = paperDocs[i];
      if (!m.active) skipped.push({ mapping: m.docId, reason: "mapping is switched off (location not ticked)" });
      else if (!doc || !doc.exists) skipped.push({ mapping: m.docId, reason: `no newspaper with id "${m.newspaperId}"` });
      else if (doc.data()!.active !== true) skipped.push({ mapping: m.docId, reason: "newspaper is not Live" });
      else papers.push({ id: doc.id, name: doc.data()!.name as string });
    });
    papers.sort((a, b) => a.name.localeCompare(b.name));

    // Development only: /api/newspapers?locationId=kelambakkam&debug=1
    if (process.env.NODE_ENV !== "production" && req.nextUrl.searchParams.get("debug"))
      return ok({ locationId, mappingsFound: mappings.length, papers, skipped });

    return ok(papers);
  } catch (e) {
    return handleError(e);
  }
}