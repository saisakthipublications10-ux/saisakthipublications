export const formatINR = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

/** basis points of an integer amount, rounded half-up, no floats in the result path */
export const bps = (amountMinor: number, basisPoints: number) =>
  Math.floor((amountMinor * basisPoints + 5000) / 10000);

/** "12.5" → 1250, "18" → 1800. Strings only, no floats. Use for rupees→paise and percent→basis points. */
export function toMinor(input: string): number | null {
  const m = /^\s*(\d{1,9})(?:\.(\d{1,2}))?\s*$/.exec(input);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 1250 → "12.50" */
export const rupeesStr = (minor: number) =>
  `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;