import { NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { ok, fail, handleError } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const send = (res: Response) => {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const locationId = (sp.get("locationId") ?? sp.get("location") ?? "").trim();
    if (!locationId) return send(fail("locationId is required", 422));

    const [mapSnap, locSnap] = await Promise.all([
      db.collection("newspaperLocations").where("locationId", "==", locationId).get(),
      db.collection("locations").get(),
    ]);
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

    // /api/newspapers?locationId=kelambakkam&debug=1 (development, or a signed-in admin)
    if (sp.get("debug") && (process.env.NODE_ENV !== "production" || (await getSession())?.role === "admin"))
      return send(ok({
        locationIdReceived: locationId,
        locationExists: locSnap.docs.some((d) => d.id === locationId),
        knownLocationIds: locSnap.docs.map((d) => d.id),
        firebaseProject: process.env.FIREBASE_PROJECT_ID ?? "(from FIREBASE_SERVICE_ACCOUNT_BASE64)",
        mappingsFound: mappings.length,
        papers,
        skipped,
      }));

    return send(ok(papers));
  } catch (e) {
    return send(handleError(e));
  }
}