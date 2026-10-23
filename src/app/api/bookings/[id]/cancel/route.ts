import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, rateLimit } from "@/lib/security";
import { transitionBooking } from "@/lib/bookings";
import { IMMEDIATE_CANCEL, REQUESTABLE_CANCEL } from "@/lib/booking-status";
import type { BookingStatus } from "@/lib/types";

const schema = z.object({ reason: z.string().trim().max(500).optional() });

export const POST = route(async (req: NextRequest, { params }: { params: { id: string } }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`cancel:${user.uid}`, 10, 3600);
  const { reason } = schema.parse(await req.json());

  const booking = (await db.collection("bookings").doc(params.id).get()).data();
  if (!booking || booking.customerId !== user.uid) throw new HttpError(404, "Booking not found");

  const status = booking.status as BookingStatus;
  const immediate = IMMEDIATE_CANCEL.includes(status);
  if (!immediate && !REQUESTABLE_CANCEL.includes(status)) {
    throw new HttpError(409, "This booking can't be cancelled from here. Please contact support.");
  }

  const next: BookingStatus = immediate ? "cancelled" : "cancellation_requested";
  await transitionBooking({
    id: params.id,
    to: next,
    actor: user.uid,
    actorRole: "customer",
    reason,
    releaseSlot: immediate,
    expectOwner: user.uid,
  });
  return ok({ status: next });
});
