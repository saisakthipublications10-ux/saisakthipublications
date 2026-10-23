import "server-only";
import type { Query } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { STATUS } from "./booking-status";

export type BookingFilters = Partial<Record<"q" | "status" | "newspaper" | "location" | "date" | "after", string>>;

export function filteredBookings(f: BookingFilters) {
  let q: Query = db.collection("bookings");
  const term = f.q?.trim();
  if (term)
    q = term.includes("@")
      ? q.where("customerEmail", "==", term.toLowerCase())
      : q.where("reference", "==", term.toUpperCase());
  if (f.status && f.status in STATUS) q = q.where("status", "==", f.status);
  if (f.newspaper) q = q.where("newspaperId", "==", f.newspaper);
  if (f.location) q = q.where("locationId", "==", f.location);
  if (f.date && /^\d{4}-\d{2}-\d{2}$/.test(f.date)) q = q.where("publicationDate", "==", f.date);
  const searching = !!term;
  if (!searching) q = q.orderBy("createdAt", "desc"); // lookups return few rows and skip the sort
  return { q, searching };
}