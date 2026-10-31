export const EPAPER = {
  maxPdfBytes: 100 * 1024 * 1024,
  maxCoverBytes: 3 * 1024 * 1024,
} as const;

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const fmtSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const at = (iso: string) => new Date(`${iso}T00:00:00`);
export const longDate = (iso: string) =>
  at(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const shortDate = (iso: string) =>
  at(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });