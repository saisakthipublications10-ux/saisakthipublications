import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { storage } from "./firebase-admin";
import { slug } from "./epaper-shared";

export const epaperDocId = (newspaperId: string, date: string, edition?: string) =>
  `${newspaperId}_${date}${edition ? `_${slug(edition)}` : ""}`;

export const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

/** Time-limited link to a private file. v4 signing happens locally, so it's fast. */
export async function signedRead(path: string, minutes: number, disposition?: string) {
  const [url] = await storage.bucket().file(path).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + minutes * 60_000,
    ...(disposition ? { responseDisposition: disposition } : {}),
  });
  return url;
}

export function toEpaperView(d: DocumentSnapshot) {
  const x = d.data()!;
  return {
    id: d.id,
    newspaperId: x.newspaperId as string,
    issueDate: x.issueDate as string,
    edition: (x.edition as string | null) ?? null,
    title: (x.title as string | null) ?? null,
    status: x.status as "draft" | "published",
    size: (x.pdf?.size as number) ?? 0,
    hasCover: !!x.cover?.path,
    downloads: (x.downloads as number) ?? 0,
  };
}
export type EpaperView = ReturnType<typeof toEpaperView>;