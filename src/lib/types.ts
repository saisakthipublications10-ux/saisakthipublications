export interface PricingRule {
  id: string;
  newspaperId: string;
  formatId: string;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  mode: "per_word" | "per_cm2" | "flat";
  rateMinor: number;
  minChargeMinor: number;
  colourSurchargeMinor: number;
}

export interface QuoteInput {
  newspaperId: string;
  formatId: string;
  date: string;
  wordCount?: number;
  areaCm2?: number;
  colour?: boolean;
  couponCode?: string;
}

export interface Quote {
  lines: Array<{ label: string; amountMinor: number }>;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: "INR";
  ruleId: string;
  isEstimate: boolean;
}

export type BookingStatus =
  | "draft"
  | "pending_payment"
  | "payment_failed"
  | "pending_review"
  | "awaiting_newspaper_confirmation"
  | "confirmed"
  | "artwork_required"
  | "rejected"
  | "published"
  | "cancellation_requested"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["pending_review", "payment_failed", "cancelled"],
  payment_failed: ["pending_payment", "cancelled"],
  pending_review: ["awaiting_newspaper_confirmation", "artwork_required", "rejected", "cancellation_requested"],
  awaiting_newspaper_confirmation: ["confirmed", "rejected", "cancellation_requested"],
  confirmed: ["published", "cancellation_requested"],
  artwork_required: ["pending_review", "cancellation_requested", "cancelled"],
  rejected: ["refund_pending", "cancelled"],
  published: [],
  cancellation_requested: ["cancelled", "refund_pending", "pending_review", "awaiting_newspaper_confirmation", "confirmed", "artwork_required"],
  cancelled: [],
  refund_pending: ["refunded"],
  refunded: [],
};
