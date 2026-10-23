import { NextRequest } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, rateLimit } from "@/lib/security";

const schema = z.object({
  message: z.string().trim().min(10, "Please add a little more detail").max(1000),
});

export const POST = route(async (req: NextRequest, { params }: { params: { id: string } }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`support:${user.uid}`, 5, 3600);
  const { message } = schema.parse(await req.json());

  const booking = (await db.collection("bookings").doc(params.id).get()).data();
  if (!booking || booking.customerId !== user.uid) throw new HttpError(404, "Booking not found");

  await db.collection("supportMessages").add({
    bookingId: params.id,
    bookingRef: booking.reference,
    uid: user.uid,
    email: user.email,
    message,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
  return ok({ sent: true }, 201);
});
