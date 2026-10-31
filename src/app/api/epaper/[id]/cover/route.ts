import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth";
import { signedRead } from "@/lib/epaper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = (await db.collection("epapers").doc(params.id).get()).data();
  const published = d?.status === "published";
  if (!d?.cover?.path || (!published && (await getSession())?.role !== "admin"))
    return new Response(null, { status: 404 });

  const res = NextResponse.redirect(await signedRead(d.cover.path, 60), 302);
  res.headers.set("Cache-Control", published ? "public, max-age=600, s-maxage=600" : "private, no-store");
  return res;
}