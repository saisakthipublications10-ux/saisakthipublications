export type FormatKind = "text" | "box" | "display" | "custom";

export interface Loc { id: string; name: string }
export interface Paper { id: string; name: string }
export interface Category { id: string; name: string }
export interface Format { id: string; name: string; kind: FormatKind }

export interface DateOpt {
  date: string;
  available: boolean;
  reason?: "holiday" | "closed" | "full" | "cutoff" | "not_scheduled";
  cutoffAt: string;
  surchargeMinor: number;
}

export interface Quote {
  lines: { label: string; amountMinor: number }[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export type QuoteStatus = "idle" | "loading" | "ok" | "error";

export interface Draft {
  key: string; // idempotency key
  locationId: string;
  newspaperId: string;
  categoryId: string;
  formatId: string;
  mode: "text" | "upload";
  content: { headline: string; body: string; contact: string; website: string; notes: string };
  widthCm: number | null;
  heightCm: number | null;
  colour: boolean;
  file: { name: string; size: number; type: string } | null; // metadata only
  date: string;
  couponCode: string;
  customer: { name: string; email: string; phone: string; gstin: string };
  acceptTerms: boolean;
  updatedAt: number;
}

export const emptyDraft = (key = ""): Draft => ({
  key,
  locationId: "",
  newspaperId: "",
  categoryId: "",
  formatId: "",
  mode: "text",
  content: { headline: "", body: "", contact: "", website: "", notes: "" },
  widthCm: null,
  heightCm: null,
  colour: false,
  file: null,
  date: "",
  couponCode: "",
  customer: { name: "", email: "", phone: "", gstin: "" },
  acceptTerms: false,
  updatedAt: 0,
});

export const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const normPhone = (s: string) => s.replace(/[\s-]/g, "");
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });