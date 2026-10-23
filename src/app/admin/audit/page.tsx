import Link from "next/link";
import { Page, td, th } from "@/components/admin/ui";
import { AuditDetails, Target, actionLabel, type Names } from "@/components/admin/audit-details";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const names = async (col: string) =>
  Object.fromEntries((await db.collection(col).get()).docs.map((d) => [d.id, (d.data().name as string) ?? d.id]));

export default async function Audit({ searchParams }: { searchParams: { limit?: string } }) {
  await requireAdmin("/admin/audit");
  const limit = Math.min(Math.max(Number(searchParams.limit) || 100, 25), 1000);

  const [snap, locations, formats, newspapers, categories] = await Promise.all([
    db.collection("auditLogs").orderBy("at", "desc").limit(limit + 1).get(),
    names("locations"), names("formats"), names("newspapers"), names("categories"),
  ]);
  const N: Names = { locations, formats, newspapers, categories };
  const rows = snap.docs.slice(0, limit);

  return (
    <Page eyebrow="Security" title="Audit log">
      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-brand-border bg-brand-bg">
            <tr>
              <th className={th}>When</th><th className={th}>Who</th><th className={th}>What happened</th><th className={th}>Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((d) => {
              const l = d.data();
              const meta = (l.meta as Record<string, unknown>) ?? {};
              return (
                <tr key={d.id} className="align-top">
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block font-medium text-brand-navy">
                      {l.at?.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                    </span>
                    <span className="text-xs text-brand-muted">
                      {l.at?.toDate().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" })}
                    </span>
                  </td>
                  <td className={`${td} text-xs`}>{l.actorEmail ?? l.actor}</td>
                  <td className={td}>
                    <span className="block font-semibold text-brand-navy">{actionLabel(l.action)}</span>
                    <span className="text-xs text-brand-muted"><Target target={String(l.target)} names={N} /></span>
                  </td>
                  <td className={td}>
                    <AuditDetails action={l.action} meta={meta} names={N} />
                    {Object.keys(meta).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] font-semibold text-brand-blue">Raw data</summary>
                        <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-brand-bg p-2 text-[11px] text-brand-text">
                          {JSON.stringify(meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-muted">No actions recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {snap.docs.length > limit && (
        <div className="text-center">
          <Link href={`/admin/audit?limit=${limit + 100}`}
            className="inline-flex min-h-10 items-center rounded-xl border border-brand-border bg-white px-5 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
            Show 100 more
          </Link>
        </div>
      )}
    </Page>
  );
}