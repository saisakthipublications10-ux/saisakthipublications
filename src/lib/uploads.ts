import "server-only";

export const ARTWORK = {
  maxBytes: 10 * 1024 * 1024,
  ext: { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg" } as const,
};
export type ArtworkType = keyof typeof ARTWORK.ext;

/** Detect real type from the first bytes; never trust the client's Content-Type alone. */
export function sniff(buf: Buffer): ArtworkType | null {
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  return null;
}

export const cleanName = (n: string) =>
  n.split(/[\\/]/).pop()!.replace(/[^\w.\- ()]/g, "_").slice(0, 100) || "artwork";

export type ScanResult = "clean" | "infected" | "skipped";
export interface Scanner { scan(path: string): Promise<ScanResult> }

/** Placeholder: swap for ClamAV / a managed scanning API. It records "skipped" honestly. */
export const scanner: Scanner = { async scan() { return "skipped"; } };