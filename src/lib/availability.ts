import "server-only";
import { adminDb } from "./firebase-admin";

export interface DateOption {
  date: string;
  available: boolean;
  reason?: "holiday" | "closed" | "full" | "cutoff" | "not_scheduled";
  cutoffAt: string; // ISO
  surchargeMinor: number;
}

const IST = "+05:30";

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function cutoffFor(date: string, h: number, m: number) {
  const prevDay = addDays(date, -1);
  return new Date(`${prevDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${IST}`);
}

interface PublicationSchedule {
  weekdays: number[];
  holidays?: string[];
  horizonDays?: number;
  cutoffHour?: number;
  cutoffMinute?: number;
}

interface DateAvailabilityOverride {
  date: string;
  closed?: boolean;
  capacity?: number | null;
  booked?: number;
  surchargeMinor?: number;
}

export async function getDateOptions(newspaperId: string): Promise<DateOption[]> {
  const schedDoc = await adminDb.collection("publicationSchedules").doc(newspaperId).get();
  if (!schedDoc.exists) return []; // admin has not configured a schedule yet
  const s = schedDoc.data() as PublicationSchedule;
  const now = new Date();
  const today = formatDate(now);
  const out: DateOption[] = [];

  const overrides = await adminDb.collection("dateAvailability").where("newspaperId", "==", newspaperId).get();
  const ov = new Map(
    overrides.docs.map((d) => {
      const data = d.data() as DateAvailabilityOverride;
      return [data.date, data] as const;
    })
  );

  for (let i = 1; i <= (s.horizonDays ?? 60); i++) {
    const date = addDays(today, i);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (!s.weekdays.includes(weekday)) continue;

    const cutoff = cutoffFor(date, s.cutoffHour ?? 17, s.cutoffMinute ?? 0);
    const o = ov.get(date);
    let reason: DateOption["reason"];
    if (s.holidays?.includes(date)) reason = "holiday";
    else if (o?.closed) reason = "closed";
    else if (o && o.capacity != null && (o.booked ?? 0) >= o.capacity) reason = "full";
    else if (now > cutoff) reason = "cutoff";

    out.push({
      date,
      available: !reason,
      reason,
      cutoffAt: cutoff.toISOString(),
      surchargeMinor: o?.surchargeMinor ?? 0,
    });
  }
  return out;
}

/** Atomically takes a slot. Call inside booking creation; throws if unavailable. */
export async function reserveDate(newspaperId: string, date: string) {
  const options = await getDateOptions(newspaperId);
  const opt = options.find((o) => o.date === date);
  if (!opt || !opt.available) throw new Error("Selected date is no longer available");

  const ref = adminDb.collection("dateAvailability").doc(`${newspaperId}_${date}`);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (data?.closed) throw new Error("Selected date is no longer available");
    if (data?.capacity != null && (data.booked ?? 0) >= data.capacity)
      throw new Error("Selected date is full");
    tx.set(ref, { newspaperId, date, booked: (data?.booked ?? 0) + 1 }, { merge: true });
  });
}

/** Gives a slot back (failed booking creation, unpaid cancellation, expired payment). */
export async function releaseDate(newspaperId: string, date: string) {
  const ref = adminDb.collection("dateAvailability").doc(`${newspaperId}_${date}`);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) tx.update(ref, { booked: Math.max(0, ((snap.data()!.booked as number) ?? 0) - 1) });
  });
}