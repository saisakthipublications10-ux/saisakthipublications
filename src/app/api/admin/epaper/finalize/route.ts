import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";
import { requireAdminAction } from "@/lib/admin";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { sniff } from "@/lib/uploads";
import { EPAPER } from "@/lib/epaper-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ uploadId: z.string().min(10).max(40) });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireAdminAction();
  const { uploadId } = schema.parse(await req.json());

  const ref = db.collection("epaperUploads").doc(uploadId);
  const u = (await ref.get()).data();
  if (!u || u.ownerId !== admin.uid) throw new HttpError(404, "Upload not found");
  if (u.status !== "pending") throw new HttpError(409, "This upload was already processed");

  const file = storage.bucket().file(u.path);
  const reject = async (msg: string) => {
    await file.delete({ ignoreNotFound: true }).catch(() => {});
    await ref.update({ status: "rejected" });
    throw new HttpError(422, msg);
  };

  const [exists] = await file.exists();
  if (!exists) throw new HttpError(409, "The file didn't arrive. Please try again.");

  const [meta] = await file.getMetadata();
  const size = Number(meta.size);
  const max = u.kind === "pdf" ? EPAPER.maxPdfBytes : EPAPER.maxCoverBytes;
  if (!size || size > max) return reject("That file is larger than allowed.");

  const [head] = await file.download({ start: 0, end: 15 }); // real type from the first bytes
  if (sniff(head) !== u.contentType)
    return reject(u.kind === "pdf" ? "That file isn't a valid PDF." : "That file isn't a valid JPEG or PNG image.");

  await ref.update({ status: "verified", size, verifiedAt: FieldValue.serverTimestamp() });
  return ok({ uploadId, size });
});