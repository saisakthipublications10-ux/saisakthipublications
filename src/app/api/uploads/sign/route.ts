import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { ok, route } from "@/lib/api";
import { assertSameOrigin, rateLimit } from "@/lib/security";
import { ARTWORK, cleanName } from "@/lib/uploads";

const schema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
  size: z.number().int().min(1).max(ARTWORK.maxBytes),
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`upload:${user.uid}`, 20, 3600);
  const input = schema.parse(await req.json());

  const ref = db.collection("uploads").doc();
  const path = `artwork/${user.uid}/${ref.id}.${ARTWORK.ext[input.contentType]}`;
  const sizeRange = `1,${ARTWORK.maxBytes}`;

  const [url] = await storage.bucket().file(path).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 10 * 60 * 1000,
    contentType: input.contentType,
    // GCS rejects the PUT if the body is outside this range
    extensionHeaders: { "x-goog-content-length-range": sizeRange },
  });

  await ref.set({
    ownerId: user.uid, path, name: cleanName(input.fileName),
    contentType: input.contentType, declaredSize: input.size,
    status: "pending", createdAt: FieldValue.serverTimestamp(),
  });
  return ok({ uploadId: ref.id, url, sizeRange });
});