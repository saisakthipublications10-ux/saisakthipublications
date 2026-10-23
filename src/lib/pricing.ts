import "server-only";
import { adminDb } from "./firebase-admin";
import { bps } from "./money";
import type { PricingRule, Quote, QuoteInput } from "./types";

export class PricingError extends Error {}

async function findRule(newspaperId: string, formatId: string, date: string): Promise<PricingRule | null> {
  const snap = await adminDb
    .collection("pricingRules")
    .where("newspaperId", "==", newspaperId)
    .where("formatId", "==", formatId)
    .where("active", "==", true)
    .get();

  const rules = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PricingRule, "id">) }))
    .filter((r) => r.effectiveFrom <= date && (!r.effectiveTo || r.effectiveTo >= date))
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1)); // latest effective wins

  return rules[0] ?? null;
}

async function applyCoupon(code: string | undefined, baseMinor: number): Promise<number> {
  if (!code) return 0;
  const doc = await adminDb.collection("coupons").doc(code.trim().toUpperCase()).get();
  if (!doc.exists) throw new PricingError("Invalid coupon code");
  const c = doc.data()!;
  const today = new Date().toISOString().slice(0, 10);
  const valid =
    c.active &&
    (!c.validFrom || c.validFrom <= today) &&
    (!c.validTo || c.validTo >= today) &&
    (c.maxUses == null || (c.used ?? 0) < c.maxUses);
  if (!valid) throw new PricingError("Coupon is not valid");
  const discount = c.type === "percent" ? bps(baseMinor, c.value * 100) : c.value;
  return Math.min(discount, baseMinor);
}

export async function calculateQuote(input: QuoteInput): Promise<Quote> {
  const rule = await findRule(input.newspaperId, input.formatId, input.date);
  if (!rule) throw new PricingError("Pricing is not configured for this selection");

  let base: number;
  let label: string;
  if (rule.mode === "per_word") {
    if (!input.wordCount || input.wordCount < 1) throw new PricingError("Word count required");
    base = rule.rateMinor * input.wordCount;
    label = `Advertisement charge (${input.wordCount} words)`;
  } else if (rule.mode === "per_cm2") {
    if (!input.areaCm2 || input.areaCm2 < 1) throw new PricingError("Area required");
    base = rule.rateMinor * input.areaCm2;
    label = `Advertisement charge (${input.areaCm2} cm²)`;
  } else {
    base = rule.rateMinor;
    label = "Advertisement charge";
  }
  base = Math.max(base, rule.minChargeMinor);

  const lines = [{ label, amountMinor: base }];

  // date-specific surcharge, if configured
  const avail = await adminDb.collection("dateAvailability").doc(`${input.newspaperId}_${input.date}`).get();
  const surcharge = avail.exists ? (avail.data()!.surchargeMinor ?? 0) : 0;
  if (surcharge > 0) lines.push({ label: "Publication date surcharge", amountMinor: surcharge });

  if (input.colour && rule.colourSurchargeMinor > 0)
    lines.push({ label: "Colour surcharge", amountMinor: rule.colourSurchargeMinor });

  const subtotal = lines.reduce((s, l) => s + l.amountMinor, 0);
  const discount = await applyCoupon(input.couponCode, subtotal);

  const taxDoc = await adminDb.collection("settings").doc("tax").get();
  const gstBps: number = taxDoc.exists ? (taxDoc.data()!.gstBps ?? 0) : 0;
  const tax = bps(subtotal - discount, gstBps);

  return {
    currency: "INR",
    lines,
    subtotalMinor: subtotal,
    discountMinor: discount,
    taxMinor: tax,
    totalMinor: subtotal - discount + tax,
    ruleId: rule.id,
    isEstimate: true,
  };
}