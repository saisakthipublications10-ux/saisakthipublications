import { NextRequest } from "next/server";
import { db, storage } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { rateLimit } from "@/lib/security";

export const GET = route(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireApiUser();
  await rateLimit(`dl:${user.uid}`, 60, 3600);

  const snap = await db.collection("bookings").doc(params.id).get();
  const b = snap.data();
  if (!b || (b.customerId !== user.uid && user.role !== "admin")) throw new HttpError(404, "Booking not found");
  if (!b.artwork?.path) throw new HttpError(404, "No artwork on this booking");

  const safeName = String(b.artwork.name).replace(/["\r\n]/g, "");
  const [url] = await storage.bucket().file(b.artwork.path).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 5 * 60 * 1000,
    responseDisposition: `attachment; filename="${safeName}"`,
  });
  return ok({ url });
});