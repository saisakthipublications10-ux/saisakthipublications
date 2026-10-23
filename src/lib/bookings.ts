import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { HttpError } from "./api";
import { TRANSITIONS, BookingStatus } from "./types";

export async function transitionBooking(o: {
  id: string;
  to: BookingStatus;
  actor: string;
  actorRole: "customer" | "admin" | "system";
  reason?: string;
  releaseSlot?: boolean;
  expectOwner?: string; // customers can only touch their own bookings
  extra?: Record<string, unknown>;
}) {
  const ref = db.collection("bookings").doc(o.id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const b = snap.data();
    if (!b || (o.expectOwner && b.customerId !== o.expectOwner)) throw new HttpError(404, "Booking not found");

    const from = b.status as BookingStatus;
    if (!TRANSITIONS[from]?.includes(o.to))
      throw new HttpError(409, "This booking can't be changed from its current status.");

    const availRef = o.releaseSlot
      ? db.collection("dateAvailability").doc(`${b.newspaperId}_${b.publicationDate}`)
      : null;
    const avail = availRef ? await tx.get(availRef) : null; // all reads before writes

    tx.update(ref, { status: o.to, updatedAt: FieldValue.serverTimestamp(), ...(o.extra ?? {}) });
    tx.set(ref.collection("statusHistory").doc(), {
      from, to: o.to, actor: o.actor, actorRole: o.actorRole, reason: o.reason ?? null,
      at: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection("auditLogs").doc(), {
      actor: o.actor, action: "booking.status", target: `bookings/${o.id}`,
      meta: { from, to: o.to }, at: FieldValue.serverTimestamp(),
    });
    if (availRef && avail?.exists)
      tx.update(availRef, { booked: Math.max(0, ((avail.data()!.booked as number) ?? 0) - 1) });
  });
}