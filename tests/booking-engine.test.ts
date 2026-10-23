// tests/booking-engine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTrustedPrice } from '../src/lib/pricing-engine';
import { assertValidStatusTransition } from '../src/lib/state-machine';
import { PricingRuleDoc, PublicationDateAvailabilityDoc } from '../src/types/firestore';

const mockConfiguredRule: PricingRuleDoc = {
  id: 'nanganallur-times_text-classified',
  newspaperId: 'nanganallur-times',
  formatId: 'text-classified',
  isConfigured: true,
  baseChargePaise: 50000, // ₹500.00
  includedWords: 20,
  extraWordRatePaise: 2500, // ₹25.00 per extra word
  ratePerSqCmPaise: 0,
  colorSurchargePercent: 20,
  boxBorderAddonPaise: 10000, // ₹100.00
  gstPercent: 5,
  effectiveFromIso: '2026-10-01T00:00:00.000Z',
  version: 1,
};

const mockAvailability: PublicationDateAvailabilityDoc = {
  id: 'nanganallur-times_2026-11-01',
  newspaperId: 'nanganallur-times',
  date: '2026-11-01',
  isOpen: true,
  isHoliday: false,
  maxSlots: 25,
  bookedSlots: 4,
  cutoffTimestampIso: '2026-10-30T17:00:00.000Z',
  dateSurchargePaise: 5000, // ₹50.00 weekend surcharge
};

describe('Saisakthi Publications Pricing & State Engine', () => {
  it('calculates exact paise breakdown for extra words, box add-on, date surcharge, and 5% GST', () => {
    const breakdown = calculateTrustedPrice({
      rule: mockConfiguredRule,
      availability: mockAvailability,
      wordCount: 25, // 5 extra words = 5 * 2500 = 12500 paise
      isColor: false,
      includeBoxAddon: true, // +10000 paise
      couponDiscountPaise: 2500, // -2500 paise
    });

    // Base(50000) + ExtraWords(12500) + Box(10000) + DateSurcharge(5000) - Discount(2500) = 75000 paise (₹750)
    expect(breakdown.taxableAmountPaise).toBe(75000);
    // 5% GST on 75000 = 3750 paise (₹37.50)
    expect(breakdown.taxAmountPaise).toBe(3750);
    // Total Payable = 78750 paise (₹787.50)
    expect(breakdown.totalPayablePaise).toBe(78750);
  });

  it('rejects price calculation when admin has not yet configured rates', () => {
    expect(() =>
      calculateTrustedPrice({
        rule: { ...mockConfiguredRule, isConfigured: false },
        availability: mockAvailability,
        wordCount: 15,
        isColor: false,
        includeBoxAddon: false,
      })
    ).toThrow(/not yet configured/i);
  });

  it('blocks customers from directly marking a booking as CONFIRMED or PUBLISHED', () => {
    expect(() =>
      assertValidStatusTransition('PENDING_REVIEW', 'CONFIRMED', 'CUSTOMER')
    ).toThrow(/not authorized/i);

    expect(() =>
      assertValidStatusTransition('CONFIRMED', 'PUBLISHED', 'ADMIN')
    ).not.toThrow();
  });
});