import Link from "next/link";
import { Download } from "lucide-react";
import { Card, Page, SelectField, Field, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/dashboard/status";
import { fmtDate } from "@/components/booking/types";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { STATUS } from "@/lib/booking-status";
import { filteredBookings, type BookingFilters } from "@/lib/admin-bookings";
import { fmtMoney, nameMap, toBookingView } from "@/lib/bookings-read";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function AdminBookings({ searchParams }: { searchParams: BookingFilters }) {
  await requireAdmin("/admin/bookings");
  const { q: base, searching } = filteredBookings(searchParams);

  let q = base.limit(PAGE + 1);
  if (!searching && searchParams.after) {
    const cursor = await db.collection("bookings").doc(searchParams.after).get();
    if (cursor.exists) q = q.startAfter(cursor);
  }

  const [snap, papersSnap, locsSnap] = await Promise.all([
    q.get(), db.collection("newspapers").get(), db.collection("locations").get(),
  ]);
  const hasMore = !searching && snap.docs.length > PAGE;
  const rows = snap.docs.slice(0, PAGE).map(toBookingView);
  const papers = nameMap("newspapers", rows.map((r) => r.newspaperId));
  const locs = nameMap("locations", rows.map((r) => r.locationId));
  const [pn, ln] = await Promise.all([papers, locs]);

  const params = new URLSearchParams();
  for (const k of ["q", "status", "newspaper", "location", "date"] as const)
    if (searchParams[k]) params.set(k, searchParams[k]!);
  const qs = params.toString();

  return (
    <Page eyebrow="Operations" title="Bookings"
      actions={
        <a href={`/api/admin/bookings/export${qs ? `?${qs}` : ""}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-border bg-white px-4 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
          <Download className="h-4 w-4" aria-hidden /> Export CSV
        </a>
      }>
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
          <Field className="lg:col-span-2" label="Reference or customer email" name="q" defaultValue={searchParams.q} placeholder="NT-… or name@email.com" />
          <SelectField label="Status" name="status" defaultValue={searchParams.status} placeholder="Any"
            options={Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.label }))} />
          <SelectField label="Newspaper" name="newspaper" defaultValue={searchParams.newspaper} placeholder="Any"
            options={papersSnap.docs.map((d) => ({ value: d.id, label: d.data().name }))} />
          <SelectField label="Location" name="location" defaultValue={searchParams.location} placeholder="Any"
            options={locsSnap.docs.map((d) => ({ value: d.id, label: d.data().name }))} />
          <Field label="Publication date" name="date" type="date" defaultValue={searchParams.date} />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <button className="min-h-10 rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white hover:bg-brand-blue">Apply filters</button>
            <Link href="/admin/bookings" className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-brand-muted hover:text-brand-navy">Clear</Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-brand-border bg-brand-bg">
            <tr><th className={th}>Reference</th><th className={th}>Newspaper</th><th className={th}>Publication</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-brand-bg/60">
                <td className={td}>
                  <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-brand-blue hover:underline">{b.reference}</Link>
                  <p className="text-[11px] text-brand-muted">{b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : ""}</p>
                </td>
                <td className={td}>{pn[b.newspaperId]}<p className="text-[11px] text-brand-muted">{ln[b.locationId]}</p></td>
                <td className={td}>{fmtDate(b.publicationDate)}</td>
                <td className={td}><StatusBadge status={b.status} /></td>
                <td className={`${td} text-right tabular-nums`}>{fmtMoney(b.totalMinor)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-10 text-center text-sm text-brand-muted" colSpan={5}>No bookings match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center">
          <Link href={`/admin/bookings?${qs ? `${qs}&` : ""}after=${rows[rows.length - 1].id}`}
            className="inline-flex min-h-10 items-center rounded-xl border border-brand-border bg-white px-5 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
            Show older
          </Link>
        </div>
      )}
    </Page>
  );
}