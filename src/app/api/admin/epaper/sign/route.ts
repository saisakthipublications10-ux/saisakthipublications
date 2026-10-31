import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";
import { requireAdminAction } from "@/lib/admin";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, rateLimit } from "@/lib/security";
import { cleanName } from "@/lib/uploads";
import { EPAPER } from "@/lib/epaper-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXT = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" } as const;

const schema = z.object({
  kind: z.enum(["pdf", "cover"]),
  newspaperId: z.string().min(1).max(80),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  size: z.number().int().min(1),
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireAdminAction();
  await rateLimit(`epaper-sign:${admin.uid}`, 30, 3600);
  const i = schema.parse(await req.json());

  const isPdf = i.kind === "pdf";
  if (isPdf !== (i.contentType === "application/pdf"))
    throw new HttpError(422, isPdf ? "The issue must be a PDF." : "The cover must be a JPEG or PNG image.");
  const max = isPdf ? EPAPER.maxPdfBytes : EPAPER.maxCoverBytes;
  if (i.size > max) throw new HttpError(422, `That file is too large (limit ${isPdf ? "100 MB" : "3 MB"}).`);
  if (!(await db.collection("newspapers").doc(i.newspaperId).get()).exists)
    throw new HttpError(422, "Choose a valid newspaper.");

  const ref = db.collection("epaperUploads").doc();
  const path = `epapers/${i.newspaperId}/${i.issueDate}/${ref.id}.${EXT[i.contentType]}`;
  const sizeRange = `1,${max}`;

  const [url] = await storage.bucket().file(path).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: i.contentType,
    extensionHeaders: { "x-goog-content-length-range": sizeRange },
  });

  await ref.set({
    ownerId: admin.uid, kind: i.kind, newspaperId: i.newspaperId, issueDate: i.issueDate,
    path, name: cleanName(i.fileName), contentType: i.contentType,
    status: "pending", createdAt: FieldValue.serverTimestamp(),
  });
  return ok({ uploadId: ref.id, url, sizeRange });
});