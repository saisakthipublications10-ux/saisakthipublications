import type { BookingStatus } from "./types";

export type Tone = "neutral" | "gold" | "blue" | "green" | "red";
export type Group = "action" | "progress" | "published" | "closed";

export const STATUS: Record<BookingStatus, { label: string; tone: Tone; group: Group; next: string }> = {
  draft: { label: "Draft", tone: "neutral", group: "action", next: "This booking hasn't been submitted yet." },
  pending_payment: { label: "Pending payment", tone: "gold", group: "action", next: "We're waiting for payment. Your date is not confirmed until payment is verified and the booking is reviewed." },
  payment_failed: { label: "Payment failed", tone: "red", group: "action", next: "Your payment didn't go through. Nothing has been confirmed." },
  pending_review: { label: "Pending review", tone: "blue", group: "progress", next: "Our team is checking your advertisement. We'll email you if anything needs changing." },
  awaiting_newspaper_confirmation: { label: "Awaiting newspaper confirmation", tone: "blue", group: "progress", next: "Your ad has passed our review and is awaiting confirmation from the newspaper." },
  confirmed: { label: "Confirmed", tone: "green", group: "progress", next: "Your publication date is confirmed. It will show as Published only after the newspaper has printed it." },
  artwork_required: { label: "Artwork required", tone: "gold", group: "action", next: "We need a corrected advertisement or artwork before we can continue. See the note below, then contact support." },
  rejected: { label: "Rejected", tone: "red", group: "closed", next: "This advertisement could not be accepted. See the reason below." },
  published: { label: "Published", tone: "green", group: "published", next: "Your advertisement has been published." },
  cancellation_requested: { label: "Cancellation requested", tone: "gold", group: "closed", next: "We've received your request and will review it under our cancellation policy." },
  cancelled: { label: "Cancelled", tone: "neutral", group: "closed", next: "This booking has been cancelled." },
  refund_pending: { label: "Refund pending", tone: "gold", group: "closed", next: "A refund is being processed." },
  refunded: { label: "Refunded", tone: "neutral", group: "closed", next: "This booking has been refunded." },
};

export const VIEWS = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs attention" },
  { id: "progress", label: "In progress" },
  { id: "published", label: "Published" },
  { id: "closed", label: "Cancelled & refunds" },
] as const;
export type ViewId = (typeof VIEWS)[number]["id"];

export const statusesFor = (view: string): BookingStatus[] | null =>
  VIEWS.some((v) => v.id === view && v.id !== "all")
    ? (Object.keys(STATUS) as BookingStatus[]).filter((s) => STATUS[s].group === view)
    : null;

/** Unpaid statuses: customer can cancel at once and the date slot is released. */
export const IMMEDIATE_CANCEL: BookingStatus[] = ["draft", "pending_payment", "payment_failed"];
/** Paid, in-flight statuses: customer can only request cancellation. */
export const REQUESTABLE_CANCEL: BookingStatus[] = [
  "pending_review", "artwork_required", "awaiting_newspaper_confirmation", "confirmed",
];