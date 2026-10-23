import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, rateLimit } from "@/lib/security";
import { ARTWORK, scanner, sniff } from "@/lib/uploads";

const schema = z.object({ uploadId: z.string().min(10).max(40) });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`finalize:${user.uid}`, 40, 3600);
  const { uploadId } = schema.parse(await req.json());

  const ref = db.collection("uploads").doc(uploadId);
  const snap = await ref.get();
  const u = snap.data();
  if (!u || u.ownerId !== user.uid) throw new HttpError(404, "Upload not found");
  if (u.status !== "pending") throw new HttpError(409, "This upload was already processed");

  const file = storage.bucket().file(u.path);
  const reject = async (msg: string) => {
    await file.delete({ ignoreNotFound: true }).catch(() => {});
    await ref.update({ status: "rejected", rejectedAt: FieldValue.serverTimestamp() });
    throw new HttpError(422, msg);
  };

  const [exists] = await file.exists();
  if (!exists) throw new HttpError(409, "The file didn't arrive. Please try uploading again.");

  const [meta] = await file.getMetadata();
  const size = Number(meta.size);
  if (!size || size > ARTWORK.maxBytes) return reject("File must be under 10 MB.");

  const [head] = await file.download({ start: 0, end: 15 });
  const real = sniff(head);
  if (!real || real !== u.contentType) return reject("That file isn't a valid PDF, PNG or JPEG.");

  const scan = await scanner.scan(u.path);
  if (scan === "infected") return reject("This file was blocked by our safety check.");

  await ref.update({ status: "verified", size, scan, verifiedAt: FieldValue.serverTimestamp() });
  return ok({ uploadId, name: u.name, size, contentType: real, scan });
});