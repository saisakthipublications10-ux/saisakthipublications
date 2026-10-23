// src/types/firestore.ts
export type Role = "CUSTOMER" | "ADMIN" | "PUBLISHER_AUDITOR";

export type BookingStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "PENDING_REVIEW"
  | "AWAITING_NEWSPAPER_CONFIRMATION"
  | "CONFIRMED"
  | "ARTWORK_REQUIRED"
  | "REJECTED"
  | "PUBLISHED"
  | "CANCELLATION_REQUESTED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "ORDER_CREATED" | "PAID" | "FAILED" | "REFUNDED";

export interface LocationDoc {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface NewspaperDoc {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  supportedCategoryIds: string[];
  supportedFormatIds: string[];
  cutoffHoursBeforePublication: number;
  publicationDaysOfWeek: number[];
  startingPricePaise?: number | null;
  updatedAt: string;
}

export interface NewspaperLocationMapDoc {
  id: string;
  newspaperId: string;
  locationId: string;
  isEnabled: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AdCategoryDoc {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface AdFormatDoc {
  id: string;
  code: "TEXT_CLASSIFIED" | "BOX_AD" | "DISPLAY_AD" | "CUSTOM_AD";
  name: string;
  requiresDimensions: boolean;
  requiresWordCount: boolean;
  allowsColorChoice: boolean;
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  specInstructions: string;
  isEnabled: boolean;
}

export interface PublicationDateAvailabilityDoc {
  id: string;
  newspaperId: string;
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  isHoliday: boolean;
  maxSlots: number;
  bookedSlots: number;
  cutoffTimestampIso: string;
  dateSurchargePaise: number;
}

export interface PricingRuleDoc {
  id: string;
  newspaperId: string;
  formatId: string;
  isConfigured: boolean;
  baseChargePaise: number;
  includedWords: number;
  extraWordRatePaise: number;
  ratePerSqCmPaise: number;
  colorSurchargePercent: number;
  boxBorderAddonPaise: number;
  gstPercent: number;
  effectiveFromIso: string;
  version: number;
}

export interface BookingDoc {
  id: string;
  bookingRef: string;
  customerId: string | null;
  locationId: string;
  newspaperId: string;
  categoryId: string;
  formatId: string;
  publicationDate: string;
  contentMode: "ONLINE_TEXT" | "UPLOADED_ARTWORK";
  adContent: {
    headline: string;
    body: string;
    wordCount: number;
    contactForPublication: string;
    publicWebsiteOrEmail: string;
    additionalInstructions: string;
    widthCm: number;
    heightCm: number;
    isColor: boolean;
    includeBoxAddon: boolean;
  };
  artworkAssetId: string | null;
  pricingSnapshot: {
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
  };
  customerDetails: {
    fullName: string;
    email: string;
    mobileWithCountryCode: string;
    billingAddress: string;
    gstin: string;
    customerNotes: string;
    acceptedTermsAtIso: string;
  };
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  draftExpiresAtIso: string;
  createdAtIso: string;
  updatedAtIso: string;
  razorpayOrderId?: string;
}