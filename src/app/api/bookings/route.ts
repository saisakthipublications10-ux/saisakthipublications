import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { bookingSchema } from "@/lib/validators";
import { calculateQuote, PricingError } from "@/lib/pricing";
import { releaseDate, reserveDate } from "@/lib/availability";
import { getSession, requireApiUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/api";
import { assertSameOrigin, clientIp, rateLimit } from "@/lib/security";

const makeRef = () =>
  `NT-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;

const idempotencyDocId = (owner: string, key: string) =>
  createHash("sha256").update(`${owner}\0${key}`).digest("hex");

type BookingResult =
  | { duplicate: true; id: string; reference: string; totalMinor: number }
  | { duplicate: false; id: string };

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const input = bookingSchema.parse(await req.json());
  const session = input.artworkUploadId ? await requireApiUser() : await getSession();
  const owner = session?.uid ?? `guest:${clientIp(req)}`;
  await rateLimit(`booking:${owner}`, 15, 3600);

  const requestRef = db.collection("bookingRequests").doc(idempotencyDocId(owner, input.idempotencyKey));
  const previousRequest = await requestRef.get();
  if (previousRequest.exists) {
    const bookingId = previousRequest.data()?.bookingId as string | undefined;
    const previous = bookingId ? await db.collection("bookings").doc(bookingId).get() : null;
    if (previous?.exists) {
      const b = previous.data()!;
      return ok({ id: previous.id, reference: b.reference, totalMinor: b.totalMinor });
    }
    throw new HttpError(409, "This booking request is still being processed. Please retry shortly.");
  }

  const [map, legacyMap] = await Promise.all([
    db.collection("newspaperLocations").doc(`${input.newspaperId}_${input.locationId}`).get(),
    db.collection("newspaper_locations").doc(`${input.newspaperId}_${input.locationId}`).get(),
  ]);
  const mapping = map.exists ? map.data() : legacyMap.data();
  if (!mapping || !(mapping.active ?? mapping.isEnabled)) {
    throw new HttpError(422, "This newspaper does not serve the selected location");
  }

  const paper = await db.collection("newspapers").doc(input.newspaperId).get();
  const paperData = paper.data();
  const formatIds = (paperData?.formatIds ?? paperData?.supportedFormatIds) as string[] | undefined;
  if (!paperData || !(paperData.active ?? paperData.isActive) || !formatIds?.includes(input.formatId)) {
    throw new HttpError(422, "Format is not available for this newspaper");
  }

  const quote = await calculateQuote({
    newspaperId: input.newspaperId,
    formatId: input.formatId,
    date: input.date,
    ...input.quote,
  }).catch((error: unknown) => {
    if (error instanceof PricingError) throw new HttpError(422, error.message);
    throw error;
  });

  try {
    await reserveDate(input.newspaperId, input.date);
  } catch (error) {
    throw new HttpError(409, error instanceof Error ? error.message : "Selected date is no longer available");
  }

  const bookingRef = db.collection("bookings").doc();
  const reference = makeRef();
  const uploadRef = input.artworkUploadId ? db.collection("uploads").doc(input.artworkUploadId) : null;

  let result: BookingResult;
  try {
    result = await db.runTransaction<BookingResult>(async (tx) => {
      const request = await tx.get(requestRef);
      if (request.exists) {
        const id = request.data()?.bookingId as string | undefined;
        if (!id) throw new HttpError(409, "This booking request is still being processed. Please retry shortly.");
        const existingRef = db.collection("bookings").doc(id);
        const existing = await tx.get(existingRef);
        if (!existing.exists) throw new HttpError(409, "This booking request is still being processed. Please retry shortly.");
        const existingData = existing.data()!;
        return {
          duplicate: true,
          id: existing.id,
          reference: existingData.reference as string,
          totalMinor: existingData.totalMinor as number,
        };
      }

      let artwork: Record<string, unknown> | null = null;
      if (uploadRef) {
        const upload = (await tx.get(uploadRef)).data();
        if (!upload || upload.ownerId !== session?.uid || upload.status !== "verified") {
          throw new HttpError(422, "Your artwork upload is no longer valid. Please upload it again.");
        }
        artwork = {
          uploadId: uploadRef.id,
          path: upload.path,
          name: upload.name,
          contentType: upload.contentType,
          size: upload.size,
          scan: upload.scan,
        };
        tx.update(uploadRef, { status: "attached", bookingId: bookingRef.id });
      }

      tx.set(bookingRef, {
        reference,
        idempotencyKey: input.idempotencyKey,
        customerId: session?.uid ?? null,
        customerEmail: input.customer.email.trim().toLowerCase(),
        customer: input.customer,
        locationId: input.locationId,
        newspaperId: input.newspaperId,
        categoryId: input.categoryId,
        formatId: input.formatId,
        publicationDate: input.date,
        content: input.content,
        artwork,
        pricingSnapshot: quote,
        currency: "INR",
        totalMinor: quote.totalMinor,
        paymentStatus: "pending",
        status: "pending_payment",
        termsAcceptedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(bookingRef.collection("statusHistory").doc(), {
        from: null,
        to: "pending_payment",
        actor: session?.uid ?? "guest",
        actorRole: "customer",
        reason: null,
        at: FieldValue.serverTimestamp(),
      });
      tx.create(requestRef, { bookingId: bookingRef.id, owner, createdAt: FieldValue.serverTimestamp() });
      return { duplicate: false, id: bookingRef.id };
    });

  } catch (error) {
    try {
      await releaseDate(input.newspaperId, input.date);
    } catch (rollbackError) {
      console.error("[api/bookings] Failed to release reserved date after booking failure", rollbackError);
      throw new HttpError(500, "Booking could not be completed. Please contact support before retrying.");
    }
    throw error;
  }

  if (result.duplicate) {
    try {
      await releaseDate(input.newspaperId, input.date);
    } catch (rollbackError) {
      console.error("[api/bookings] Failed to release duplicate request date reservation", rollbackError);
      throw new HttpError(500, "Booking request could not be completed. Please contact support.");
    }
    return ok({ id: result.id, reference: result.reference, totalMinor: result.totalMinor });
  }

  return ok({ id: result.id, reference, totalMinor: quote.totalMinor }, 201);
});
