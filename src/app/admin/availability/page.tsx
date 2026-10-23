import Link from "next/link";
import { addDays, format } from "date-fns";
import { Badge, CheckField, Field, Page } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { saveDate } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { istToday } from "@/lib/admin";
import { rupeesStr } from "@/lib/money";

export const metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function Availability({ searchParams }: { searchParams: { paper?: string; all?: string } }) {
  await requireAdmin("/admin/availability");
  const papers = await db.collection("newspapers").orderBy("name").get();
  const paperId = searchParams.paper ?? papers.docs[0]?.id;

  let rows: { date: string; label: string; holiday: boolean; av: FirebaseFirestore.DocumentData | undefined }[] = [];
  if (paperId) {
    const [schedSnap, avSnap] = await Promise.all([
      db.collection("publicationSchedules").doc(paperId).get(),
      db.collection("dateAvailability").where("newspaperId", "==", paperId).get(),
    ]);
    const s = schedSnap.data();
    const av = new Map(avSnap.docs.map((d) => [d.data().date as string, d.data()]));
    if (s) {
      const start = new Date(`${istToday()}T00:00:00`);
      const limit = searchParams.all ? (s.horizonDays as number) : 28;
      for (let i = 1; i <= limit; i++) {
        const d = addDays(start, i);
        if (!(s.weekdays as number[]).includes(d.getDay())) continue;
        const date = format(d, "yyyy-MM-dd");
        rows.push({ date, label: format(d, "EEE, d MMM yyyy"), holiday: (s.holidays as string[]).includes(date), av: av.get(date) });
      }
    }
  }

  return (
    <Page eyebrow="Scheduling" title="Availability">
      <div className="flex flex-wrap gap-2">
        {papers.docs.map((d) => (
          <Link key={d.id} href={`/admin/availability?paper=${d.id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${d.id === paperId ? "bg-brand-navy text-white" : "border border-brand-border bg-white text-brand-navy hover:bg-brand-bg"}`}>
            {d.data().name}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-brand-muted">
          No publication days are set for this newspaper. Set them under Newspapers → Configure.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const booked = (r.av?.booked as number) ?? 0;
            const cap = r.av?.capacity as number | null | undefined;
            const full = cap != null && booked >= cap;
            return (
              <li key={r.date} className="rounded-2xl border border-brand-border bg-white p-4 shadow-card">
                <AdminForm action={saveDate} className="grid items-end gap-3 md:grid-cols-[170px_1fr_1fr_auto_auto]">
                  <input type="hidden" name="newspaperId" value={paperId} />
                  <input type="hidden" name="date" value={r.date} />
                  <div>
                    <p className="font-display text-base font-semibold text-brand-navy">{r.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {r.holiday ? <Badge tone="red">Holiday</Badge> : r.av?.closed ? <Badge tone="red">Closed</Badge> : full ? <Badge tone="gold">Full</Badge> : <Badge tone="green">Open</Badge>}
                      <Link href={`/admin/bookings?newspaper=${paperId}&date=${r.date}`} className="text-[11px] font-semibold text-brand-blue">{booked} booked</Link>
                    </div>
                  </div>
                  <Field label="Capacity (blank = unlimited)" name="capacity" type="number" min={1} defaultValue={cap ?? ""} />
                  <Field label="Surcharge (₹)" name="surcharge" prefix="₹" defaultValue={r.av?.surchargeMinor ? rupeesStr(r.av.surchargeMinor) : ""} />
                  <div className="pb-1"><CheckField label="Close date" name="closed" defaultChecked={!!r.av?.closed} /></div>
                  <SubmitButton tone="outline">Save</SubmitButton>
                </AdminForm>
              </li>
            );
          })}
        </ul>
      )}

      {rows.length > 0 && !searchParams.all && (
        <Link href={`/admin/availability?paper=${paperId}&all=1`} className="text-sm font-semibold text-brand-blue">Show all bookable dates</Link>
      )}
    </Page>
  );
}