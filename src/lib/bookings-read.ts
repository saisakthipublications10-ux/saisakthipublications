import "server-only";
import type { DocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import type { BookingStatus } from "./types";

const iso = (t?: Timestamp) => (t ? t.toDate().toISOString() : null);

export function toBookingView(d: DocumentSnapshot) {
  const x = d.data()!;
  return {
    id: d.id,
    reference: x.reference as string,
    status: x.status as BookingStatus,
    paymentStatus: (x.paymentStatus as string) ?? "pending",
    publicationDate: x.publicationDate as string,
    totalMinor: (x.totalMinor as number) ?? 0,
    newspaperId: x.newspaperId as string,
    locationId: x.locationId as string,
    categoryId: x.categoryId as string,
    formatId: x.formatId as string,
    createdAt: iso(x.createdAt),
    content: x.content as { headline?: string; body: string; contact: string; website?: string },
    pricing: x.pricingSnapshot as {
      lines: { label: string; amountMinor: number }[];
      discountMinor: number; taxMinor: number; totalMinor: number;
    },
    artwork: x.artwork ? { name: x.artwork.name as string, size: x.artwork.size as number } : null,
  };
}
export type BookingView = ReturnType<typeof toBookingView>;

export async function nameMap(collection: string, ids: string[]) {
  const uniq = Array.from(new Set(ids)).filter(Boolean);
  if (!uniq.length) return {} as Record<string, string>;
  const docs = await db.getAll(...uniq.map((i) => db.collection(collection).doc(i)));
  return Object.fromEntries(docs.map((d) => [d.id, (d.data()?.name as string) ?? d.id]));
}

export const fmtMoney = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);