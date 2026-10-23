// src/lib/pricing-engine.ts
import { PricingRuleDoc, PublicationDateAvailabilityDoc } from "@/types/firestore";

export interface PriceInput {
  rule: PricingRuleDoc;
  availability: PublicationDateAvailabilityDoc;
  wordCount?: number;
  widthCm?: number;
  heightCm?: number;
  isColor: boolean;
  includeBoxAddon: boolean;
  couponDiscountPaise?: number;
}

export interface PriceBreakdown {
  ruleVersion: number;
  baseChargePaise: number;
  volumeOrAreaChargePaise: number;
  colorChargePaise: number;
  dateSurchargePaise: number;
  addonsPaise: number;
  discountPaise: number;
  taxableAmountPaise: number;
  gstPercent: number;
  taxAmountPaise: number;
  totalPayablePaise: number;
  currency: "INR";
}

export function calculateTrustedPrice(input: PriceInput): PriceBreakdown {
  const { rule, availability } = input;

  if (!rule.isConfigured || rule.baseChargePaise < 0) {
    throw new Error(
      "Pricing is not yet configured by the administrator for this newspaper and format."
    );
  }

  const baseChargePaise = Math.round(rule.baseChargePaise);
  let volumeOrAreaChargePaise = 0;

  if (typeof input.wordCount === "number" && input.wordCount > rule.includedWords) {
    const extraWords = input.wordCount - rule.includedWords;
    volumeOrAreaChargePaise += extraWords * Math.round(rule.extraWordRatePaise);
  }

  if (
    rule.ratePerSqCmPaise > 0 &&
    typeof input.widthCm === "number" &&
    typeof input.heightCm === "number"
  ) {
    const areaSqCm = input.widthCm * input.heightCm;
    if (areaSqCm <= 0) throw new Error("Invalid advertisement dimensions.");
    volumeOrAreaChargePaise += Math.round(areaSqCm * rule.ratePerSqCmPaise);
  }

  const subtotalBeforeSurcharges = baseChargePaise + volumeOrAreaChargePaise;

  const colorChargePaise = input.isColor
    ? Math.round((subtotalBeforeSurcharges * rule.colorSurchargePercent) / 100)
    : 0;

  const addonsPaise = input.includeBoxAddon ? Math.round(rule.boxBorderAddonPaise) : 0;
  const dateSurchargePaise = Math.round(availability.dateSurchargePaise || 0);

  const grossAmountPaise =
    subtotalBeforeSurcharges + colorChargePaise + addonsPaise + dateSurchargePaise;

  const discountPaise = Math.min(
    Math.max(0, Math.round(input.couponDiscountPaise || 0)),
    grossAmountPaise
  );

  const taxableAmountPaise = grossAmountPaise - discountPaise;
  const taxAmountPaise = Math.round((taxableAmountPaise * rule.gstPercent) / 100);
  const totalPayablePaise = taxableAmountPaise + taxAmountPaise;

  return {
    ruleVersion: rule.version,
    baseChargePaise,
    volumeOrAreaChargePaise,
    colorChargePaise,
    dateSurchargePaise,
    addonsPaise,
    discountPaise,
    taxableAmountPaise,
    gstPercent: rule.gstPercent,
    taxAmountPaise,
    totalPayablePaise,
    currency: "INR" as const,
  };
}