"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { HttpError } from "@/lib/api";
import { audit, bool, istToday, run, slugify, str } from "@/lib/admin";
import { toMinor } from "@/lib/money";
import { transitionBooking } from "@/lib/bookings";
import type { BookingStatus } from "@/lib/types";
import type { Result } from "@/lib/admin-types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const name = z.string().trim().min(2, "Name is too short").max(80);

function money(v: string, label: string, emptyIsZero = false) {
  if (!v && emptyIsZero) return 0;
  const m = toMinor(v);
  if (m === null) throw new HttpError(422, `${label} must be an amount like 12.50`);
  return m;
}

async function setActive(col: string, fd: FormData) {
  const res = await run(async (admin) => {
    const id = str(fd, "id");
    const active = str(fd, "next") === "true";
    const ref = db.collection(col).doc(id);
    if (!id || !(await ref.get()).exists) throw new HttpError(404, "Not found");
    await ref.update({ active });
    await audit(admin, `${col}.${active ? "enable" : "disable"}`, `${col}/${id}`);
    return "Saved";
  });
  if (!res.ok) throw new Error(res.message);
}
export async function toggleLocation(fd: FormData) { await setActive("locations", fd); }
export async function toggleNewspaper(fd: FormData) {
  const res = await run(async (admin) => {
    const id = str(fd, "id");
    const active = str(fd, "next") === "true";
    const ref = db.collection("newspapers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Not found");

    if (active) {
      const [maps, sched] = await Promise.all([
        db.collection("newspaperLocations").where("newspaperId", "==", id).where("active", "==", true).limit(1).get(),
        db.collection("publicationSchedules").doc(id).get(),
      ]);
      const formats = (snap.data()!.formatIds as string[]) ?? [];
      const days = (sched.data()?.weekdays as number[]) ?? [];
      if (maps.empty || !formats.length || !days.length)
        throw new HttpError(422, "Set at least one location, one format and one publication day first (use Configure).");
    }

    await ref.update({ active });
    await audit(admin, `newspapers.${active ? "enable" : "disable"}`, `newspapers/${id}`);
    return "Saved";
  });
  if (!res.ok) throw new Error(res.message);
}
export async function toggleCategory(fd: FormData) { await setActive("categories", fd); }
export async function toggleFormat(fd: FormData) { await setActive("formats", fd); }
export async function toggleRule(fd: FormData) { await setActive("pricingRules", fd); }
export async function toggleCoupon(fd: FormData) { await setActive("coupons", fd); }

/* ───────── Locations / catalog ───────── */
export async function saveLocation(_: Result, fd: FormData) {
  return run(async (admin) => {
    const n = name.parse(str(fd, "name"));
    const id = str(fd, "id") || slugify(n);
    const ref = db.collection("locations").doc(id);
    const exists = (await ref.get()).exists;
    await ref.set({ name: n, slug: id, ...(exists ? {} : { active: true }) }, { merge: true });
    await audit(admin, exists ? "location.update" : "location.create", `locations/${id}`, { name: n });
    return exists ? "Location updated" : "Location created";
  });
}

export async function saveCategory(_: Result, fd: FormData) {
  return run(async (admin) => {
    const n = name.parse(str(fd, "name"));
    const id = slugify(n);
    const ref = db.collection("categories").doc(id);
    if ((await ref.get()).exists) throw new HttpError(409, "That category already exists");
    await ref.set({ name: n, active: true });
    await audit(admin, "category.create", `categories/${id}`);
    return "Category added";
  });
}

export async function saveFormat(_: Result, fd: FormData) {
  return run(async (admin) => {
    const n = name.parse(str(fd, "name"));
    const kind = z.enum(["text", "box", "display", "custom"]).parse(str(fd, "kind"));
    const id = slugify(n);
    const ref = db.collection("formats").doc(id);
    if ((await ref.get()).exists) throw new HttpError(409, "That format already exists");
    await ref.set({ name: n, kind, active: true });
    await audit(admin, "format.create", `formats/${id}`);
    return "Format added";
  });
}

/* ───────── Newspapers ───────── */
export async function createNewspaper(_: Result, fd: FormData) {
  return run(async (admin) => {
    const n = name.parse(str(fd, "name"));
    const id = slugify(n);
    const ref = db.collection("newspapers").doc(id);
    if ((await ref.get()).exists) throw new HttpError(409, "A newspaper with this name already exists");
    await ref.set({ name: n, slug: id, logoUrl: null, active: false, formatIds: [], cutoffHour: 17, cutoffMinute: 0 });
    await audit(admin, "newspaper.create", `newspapers/${id}`);
    return "Created (disabled). Use Configure to set it up.";
  });
}

export async function saveNewspaper(_: Result, fd: FormData) {
  return run(async (admin) => {
    const id = str(fd, "id");
    const paperRef = db.collection("newspapers").doc(id);
    if (!(await paperRef.get()).exists) throw new HttpError(404, "Newspaper not found");

    const n = name.parse(str(fd, "name"));
    const active = bool(fd, "active");

    const [locSnap, fmtSnap] = await Promise.all([db.collection("locations").get(), db.collection("formats").get()]);
    const validLocs = new Set(locSnap.docs.map((d) => d.id));
    const validFmts = new Set(fmtSnap.docs.map((d) => d.id));

    const chosenLocs = fd.getAll("locations").map(String).filter((l) => validLocs.has(l));
    const formatIds = fd.getAll("formats").map(String).filter((f) => validFmts.has(f));
    const weekdays = [...new Set(fd.getAll("weekdays").map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();

    const horizonDays = z.coerce.number().int().min(7).max(365).parse(str(fd, "horizonDays") || "60");
    const cutoffHour = z.coerce.number().int().min(0).max(23).parse(str(fd, "cutoffHour") || "17");
    const cutoffMinute = z.coerce.number().int().min(0).max(59).parse(str(fd, "cutoffMinute") || "0");

    const holidays = [...new Set(
      str(fd, "holidays").split(/[\s,]+/).filter(Boolean).map((h) => dateStr.parse(h)),
    )].sort();

    if (active && (!chosenLocs.length || !formatIds.length || !weekdays.length))
      throw new HttpError(422, "Before enabling, choose at least one location, one format and one publication day.");

    const batch = db.batch();
    batch.update(paperRef, { name: n, active, formatIds, cutoffHour, cutoffMinute });
    batch.set(db.collection("publicationSchedules").doc(id), { weekdays, holidays, horizonDays, cutoffHour, cutoffMinute });
    for (const loc of validLocs)
      batch.set(
        db.collection("newspaperLocations").doc(`${id}_${loc}`),
        { newspaperId: id, locationId: loc, active: chosenLocs.includes(loc) },
        { merge: true },
      );
    await batch.commit();
    await audit(admin, "newspaper.update", `newspapers/${id}`, { active, locations: chosenLocs, formatIds, weekdays });
    return "Newspaper saved";
  });
}

/* ───────── Availability ───────── */
export async function saveDate(_: Result, fd: FormData) {
  return run(async (admin) => {
    const newspaperId = str(fd, "newspaperId");
    const date = dateStr.parse(str(fd, "date"));
    const capRaw = str(fd, "capacity");
    const capacity = capRaw ? z.coerce.number().int().min(1).max(1000).parse(capRaw) : null; // blank = unlimited
    const closed = bool(fd, "closed");
    const surchargeMinor = money(str(fd, "surcharge"), "Surcharge", true);

    const ref = db.collection("dateAvailability").doc(`${newspaperId}_${date}`);
    await db.runTransaction(async (tx) => {
      const booked = ((await tx.get(ref)).data()?.booked as number | undefined) ?? 0;
      if (capacity !== null && capacity < booked)
        throw new HttpError(409, `${booked} ad(s) are already booked for this date. Capacity can't be lower.`);
      tx.set(ref, { newspaperId, date, capacity, closed, surchargeMinor, booked }, { merge: true });
    });
    await audit(admin, "availability.update", ref.path, { capacity, closed, surchargeMinor });
    return "Date saved";
  });
}

/* ───────── Pricing ───────── */
export async function saveTax(_: Result, fd: FormData) {
  return run(async (admin) => {
    const gstBps = money(str(fd, "gst"), "GST rate"); // "18" → 1800 basis points
    if (gstBps > 2800) throw new HttpError(422, "GST rate looks too high. Check the value.");
    await db.collection("settings").doc("tax").set({ gstBps }, { merge: true });
    await audit(admin, "tax.update", "settings/tax", { gstBps });
    return "Tax rate saved";
  });
}

const dayBefore = (d: string) => new Date(new Date(`${d}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);

export async function createRule(_: Result, fd: FormData) {
  return run(async (admin) => {
    const newspaperId = str(fd, "newspaperId");
    const formatId = str(fd, "formatId");
    const mode = z.enum(["flat", "per_word", "per_cm2"]).parse(str(fd, "mode"));
    const rateMinor = money(str(fd, "rate"), "Rate");
    const minChargeMinor = money(str(fd, "minCharge"), "Minimum charge", true);
    const colourSurchargeMinor = money(str(fd, "colour"), "Colour surcharge", true);
    const effectiveFrom = dateStr.parse(str(fd, "effectiveFrom"));
    if (rateMinor <= 0) throw new HttpError(422, "Rate must be greater than zero");

    const [paper, fmt] = await Promise.all([
      db.collection("newspapers").doc(newspaperId).get(),
      db.collection("formats").doc(formatId).get(),
    ]);
    if (!paper.exists || !fmt.exists) throw new HttpError(422, "Choose a valid newspaper and format");

    const newRef = db.collection("pricingRules").doc();
    await db.runTransaction(async (tx) => {
      const open = await tx.get(
        db.collection("pricingRules")
          .where("newspaperId", "==", newspaperId).where("formatId", "==", formatId).where("active", "==", true),
      );
      for (const d of open.docs) {
        const r = d.data();
        if (r.effectiveTo && r.effectiveTo < effectiveFrom) continue; // already ended before this one
        if (r.effectiveFrom >= effectiveFrom)
          throw new HttpError(409, `An existing rate starts on ${r.effectiveFrom}. The new rate must start after it.`);
        tx.update(d.ref, { effectiveTo: dayBefore(effectiveFrom) }); // keep history, end the old rate
      }
      tx.set(newRef, {
        newspaperId, formatId, mode, rateMinor, minChargeMinor, colourSurchargeMinor,
        effectiveFrom, effectiveTo: null, active: true,
        createdAt: FieldValue.serverTimestamp(), createdBy: admin.uid,
      });
    });
    await audit(admin, "pricing.create", newRef.path, { newspaperId, formatId, mode, rateMinor, effectiveFrom });
    return "Rate added. The previous rate now ends the day before.";
  });
}

export async function saveCoupon(_: Result, fd: FormData) {
  return run(async (admin) => {
    const code = z.string().regex(/^[A-Z0-9]{3,20}$/, "Code: 3–20 capital letters or digits").parse(str(fd, "code").toUpperCase());
    const type = z.enum(["percent", "flat"]).parse(str(fd, "type"));
    const value =
      type === "percent"
        ? z.coerce.number().int().min(1, "Percent must be 1–100").max(100, "Percent must be 1–100").parse(str(fd, "value"))
        : money(str(fd, "value"), "Discount amount");
    if (type === "flat" && value <= 0) throw new HttpError(422, "Discount must be greater than zero");
    const validFrom = str(fd, "validFrom") ? dateStr.parse(str(fd, "validFrom")) : null;
    const validTo = str(fd, "validTo") ? dateStr.parse(str(fd, "validTo")) : null;
    const maxUses = str(fd, "maxUses") ? z.coerce.number().int().min(1).parse(str(fd, "maxUses")) : null;

    const ref = db.collection("coupons").doc(code);
    if ((await ref.get()).exists) throw new HttpError(409, "That coupon code already exists");
    await ref.set({ type, value, validFrom, validTo, maxUses, used: 0, active: true });
    await audit(admin, "coupon.create", ref.path, { type, value });
    return "Coupon created";
  });
}

/* ───────── Bookings ───────── */
export async function bookingAction(_: Result, fd: FormData): Promise<Result> {
  return run(async (admin) => {
    const id = str(fd, "id");
    const intent = str(fd, "intent");
    const reason = str(fd, "reason").slice(0, 500);
    const snap = await db.collection("bookings").doc(id).get();
    const b = snap.data();
    if (!b) throw new HttpError(404, "Booking not found");
    const need = (msg: string) => { if (reason.length < 5) throw new HttpError(422, msg); };

    let to: BookingStatus;
    let extra: Record<string, unknown> | undefined;
    let after: (() => Promise<void>) | undefined;
    let done = "Booking updated";

    switch (intent) {
      case "approve":
        to = "awaiting_newspaper_confirmation"; done = "Approved. Next, confirm the slot with the newspaper."; break;
      case "request_correction":
        need("Tell the customer what needs to change (at least 5 characters)."); to = "artwork_required"; break;
      case "reject":
        need("Give the customer a reason for rejecting."); to = "rejected"; break;
      case "resume_review":
        to = "pending_review"; break;
      case "confirm":
        to = "confirmed"; done = "Confirmed with the newspaper."; break;
      case "publish":
        if (b.publicationDate > istToday()) throw new HttpError(409, "This can only be recorded on or after the publication date.");
        to = "published"; extra = { publishedAt: FieldValue.serverTimestamp(), publishedBy: admin.uid }; done = "Recorded as published."; break;
      case "approve_cancel":
        to = "cancelled"; done = "Cancellation approved and the date released."; break;
      case "decline_cancel": {
        need("Tell the customer why the cancellation was declined.");
        const hist = await snap.ref.collection("statusHistory").orderBy("at", "asc").get();
        const last = [...hist.docs].reverse().find((h) => h.data().to === "cancellation_requested");
        const prev = last?.data().from as BookingStatus | undefined;
        if (!prev) throw new HttpError(409, "Can't work out the previous status.");
        to = prev; break;
      }
      case "start_refund":
        if (b.paymentStatus !== "paid") throw new HttpError(409, "No verified payment to refund.");
        to = "refund_pending"; extra = { paymentStatus: "refund_pending" }; break;
      case "record_refund": {
        const refundRef = str(fd, "refundRef");
        if (refundRef.length < 3) throw new HttpError(422, "Enter the refund reference from the payment provider.");
        const amountMinor = money(str(fd, "refundAmount"), "Refund amount");
        if (amountMinor <= 0 || amountMinor > (b.totalMinor as number))
          throw new HttpError(422, "Refund amount must be between ₹0.01 and the booking total.");
        to = "refunded"; extra = { paymentStatus: "refunded", refundedMinor: amountMinor };
        after = async () => {
          await db.collection("refunds").add({
            bookingId: id, bookingRef: b.reference, amountMinor, reference: refundRef,
            recordedBy: admin.uid, at: FieldValue.serverTimestamp(),
          });
        };
        done = "Refund recorded."; break;
      }
      default:
        throw new HttpError(422, "Unknown action");
    }

    await transitionBooking({
      id, to, actor: admin.uid, actorRole: "admin", reason: reason || undefined,
      releaseSlot: to === "rejected" || to === "cancelled", extra,
    });
    await after?.();
    return done;
  });
}

/* ───────── Support ───────── */
export async function resolveSupport(fd: FormData) {
  const res = await run(async (admin) => {
    const id = str(fd, "id");
    const ref = db.collection("supportMessages").doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "Message not found");
    await ref.update({ status: "resolved", resolvedBy: admin.uid, resolvedAt: FieldValue.serverTimestamp() });
    await audit(admin, "support.resolve", ref.path);
    return "Resolved";
  });
  if (!res.ok) throw new Error(res.message);
}