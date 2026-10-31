import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth";
import { HttpError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";
import { signedRead } from "@/lib/epaper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await rateLimit(`epaper:${clientIp(req)}`, 60, 3600);

    const snap = await db.collection("epapers").doc(params.id).get();
    const d = snap.data();
    const isAdmin = (await getSession())?.role === "admin";
    if (!d || (d.status !== "published" && !isAdmin)) throw new HttpError(404, "Issue not found");

    const view = req.nextUrl.searchParams.get("view") === "1";
    const paper = (await db.collection("newspapers").doc(d.newspaperId).get()).data()?.name ?? "newspaper";
    const base = `${paper}-${d.issueDate}${d.edition ? `-${d.edition}` : ""}`
      .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

    if (!view && d.status === "published")
      snap.ref.update({ downloads: FieldValue.increment(1) }).catch(() => {});

    const url = await signedRead(d.pdf.path, 5, `${view ? "inline" : "attachment"}; filename="${base}.pdf"`);
    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (!(e instanceof HttpError)) console.error("[epaper]", e instanceof Error ? e.message : "unknown error");
    const notice = e instanceof HttpError && e.status === 429 ? "slow" : "unavailable";
    return NextResponse.redirect(new URL(`/epaper?notice=${notice}`, req.url));
  }
}