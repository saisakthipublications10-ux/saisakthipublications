"use server";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db, storage } from "@/lib/firebase-admin";
import { HttpError } from "@/lib/api";
import { audit, run, str } from "@/lib/admin";
import { epaperDocId } from "@/lib/epaper";
import type { Result } from "@/lib/admin-types";

const input = z.object({
  newspaperId: z.string().min(1),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid issue date"),
  edition: z.string().trim().max(40).default(""),
  title: z.string().trim().max(120).default(""),
  pdfUploadId: z.string().min(10).max(40),
  coverUploadId: z.string().min(10).max(40).nullable(),
  publish: z.boolean(),
});

export async function createEpaper(raw: z.input<typeof input>): Promise<Result> {
  return run(async (admin) => {
    const i = input.parse(raw);

    // an issue dated more than a few days ahead is almost certainly a typo
    const latest = new Date(Date.now() + (5.5 * 3600 + 3 * 86400) * 1000).toISOString().slice(0, 10);
    if (i.issueDate > latest) throw new HttpError(422, "That issue date is too far in the future.");
    if (!(await db.collection("newspapers").doc(i.newspaperId).get()).exists)
      throw new HttpError(422, "Choose a valid newspaper.");

    const id = epaperDocId(i.newspaperId, i.issueDate, i.edition);
    const ref = db.collection("epapers").doc(id);
    const pdfRef = db.collection("epaperUploads").doc(i.pdfUploadId);
    const coverRef = i.coverUploadId ? db.collection("epaperUploads").doc(i.coverUploadId) : null;

    await db.runTransaction(async (tx) => {
      const [existing, pdf, cover] = await Promise.all([
        tx.get(ref), tx.get(pdfRef), coverRef ? tx.get(coverRef) : Promise.resolve(null),
      ]);
      if (existing.exists)
        throw new HttpError(409, "An issue for this newspaper, date and edition already exists. Delete it first, or use a different edition name.");

      const valid = (s: FirebaseFirestore.DocumentSnapshot | null, kind: string) => {
        const d = s?.data();
        return !!d && d.ownerId === admin.uid && d.kind === kind && d.status === "verified" &&
          d.newspaperId === i.newspaperId && d.issueDate === i.issueDate;
      };
      if (!valid(pdf, "pdf")) throw new HttpError(422, "The PDF upload isn't valid. Please upload it again.");
      if (coverRef && !valid(cover, "cover")) throw new HttpError(422, "The cover upload isn't valid. Please upload it again.");

      const p = pdf.data()!;
      const now = FieldValue.serverTimestamp();
      tx.set(ref, {
        newspaperId: i.newspaperId,
        issueDate: i.issueDate,
        edition: i.edition || null,
        title: i.title || null,
        pdf: { path: p.path, name: p.name, size: p.size },
        cover: cover ? { path: cover.data()!.path } : null,
        status: i.publish ? "published" : "draft",
        downloads: 0,
        createdAt: now,
        createdBy: admin.uid,
        publishedAt: i.publish ? now : null,
      });
      tx.update(pdfRef, { status: "attached", epaperId: id });
      if (coverRef) tx.update(coverRef, { status: "attached", epaperId: id });
    });

    await audit(admin, "epaper.create", `epapers/${id}`, { newspaperId: i.newspaperId, issueDate: i.issueDate, published: i.publish });
    return i.publish ? "Issue published." : "Saved as a draft.";
  });
}

export async function setEpaperStatus(fd: FormData) {
  const res = await run(async (admin) => {
    const id = str(fd, "id");
    const to = str(fd, "to") === "published" ? "published" : "draft";
    const ref = db.collection("epapers").doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "Issue not found");
    await ref.update({ status: to, publishedAt: to === "published" ? FieldValue.serverTimestamp() : null });
    await audit(admin, to === "published" ? "epaper.publish" : "epaper.unpublish", `epapers/${id}`);
    return "Saved";
  });
  if (!res.ok) throw new Error(res.message);
}

export async function deleteEpaper(fd: FormData) {
  const res = await run(async (admin) => {
    const id = str(fd, "id");
    const ref = db.collection("epapers").doc(id);
    const d = (await ref.get()).data();
    if (!d) throw new HttpError(404, "Issue not found");
    const paths = [d.pdf?.path, d.cover?.path].filter(Boolean) as string[];
    await Promise.all(paths.map((p) => storage.bucket().file(p).delete({ ignoreNotFound: true }).catch(() => {})));
    await ref.delete();
    await audit(admin, "epaper.delete", `epapers/${id}`, { newspaperId: d.newspaperId, issueDate: d.issueDate });
    return "Deleted";
  });
  if (!res.ok) throw new Error(res.message);
}