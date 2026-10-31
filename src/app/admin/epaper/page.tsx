import { FileText } from "lucide-react";
import { Badge, Card, Page, td, th } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/forms";
import { EpaperUploader } from "@/components/admin/epaper-uploader";
import { deleteEpaper, setEpaperStatus } from "./action";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { toEpaperView, todayIST } from "@/lib/epaper";
import { fmtSize, shortDate } from "@/lib/epaper-shared";

export const metadata = { title: "E-Paper" };
export const dynamic = "force-dynamic";

export default async function AdminEpaper() {
  await requireAdmin("/admin/epaper");
  const [snap, papers] = await Promise.all([
    db.collection("epapers").orderBy("issueDate", "desc").limit(60).get(),
    db.collection("newspapers").orderBy("name").get(),
  ]);
  const rows = snap.docs.map(toEpaperView);
  const list = papers.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
  const names = Object.fromEntries(list.map((p) => [p.id, p.name]));

  return (
    <Page eyebrow="Content" title="E-Paper">
      <Card title="Upload an issue">
        <EpaperUploader newspapers={list} today={todayIST()} />
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-brand-border bg-brand-bg">
            <tr>
              <th className={th}>Issue</th><th className={th}>Newspaper</th><th className={th}>Status</th>
              <th className={th}>Size</th><th className={th}>Downloads</th><th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((r) => (
              <tr key={r.id} className="align-middle">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded border border-brand-border bg-brand-bg">
                      {r.hasCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/epaper/${r.id}/cover`} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
                      ) : <FileText className="h-5 w-5 text-brand-muted" aria-hidden />}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy">{shortDate(r.issueDate)}</p>
                      {(r.edition || r.title) && <p className="text-xs text-brand-muted">{[r.edition, r.title].filter(Boolean).join(" · ")}</p>}
                    </div>
                  </div>
                </td>
                <td className={td}>{names[r.newspaperId] ?? r.newspaperId}</td>
                <td className={td}><Badge tone={r.status === "published" ? "green" : "gold"}>{r.status === "published" ? "Published" : "Draft"}</Badge></td>
                <td className={`${td} tabular-nums`}>{fmtSize(r.size)}</td>
                <td className={`${td} tabular-nums`}>{r.downloads}</td>
                <td className={td}>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <a href={`/api/epaper/${r.id}/download?view=1`} target="_blank" rel="noopener"
                      className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-bg">Preview</a>
                    <form action={setEpaperStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="to" value={r.status === "published" ? "draft" : "published"} />
                      <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-bg">
                        {r.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteEpaper}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmSubmit confirm="Delete this issue and its files permanently?"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-muted">No issues uploaded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}