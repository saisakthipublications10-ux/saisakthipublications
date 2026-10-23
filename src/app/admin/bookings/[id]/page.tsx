import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge, Card, Page } from "@/components/admin/ui";
import { BookingActions } from "@/components/admin/booking-actions";
import { StatusBadge } from "@/components/dashboard/status";
import { DownloadArtwork } from "@/components/dashboard/actions";
import { fmtDate } from "@/components/booking/types";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { STATUS } from "@/lib/booking-status";
import { fmtMoney, nameMap, toBookingView } from "@/lib/bookings-read";

export const metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

export default async function AdminBooking({ params }: { params: { id: string } }) {
  await requireAdmin(`/admin/bookings/${params.id}`);
  const snap = await db.collection("bookings").doc(params.id).get();
  if (!snap.exists) notFound();

  const raw = snap.data()!;
  const b = toBookingView(snap);
  const c = raw.customer as { name: string; email: string; phone: string; gstin?: string };

  const [hist, refunds, papers, locs, cats, fmts] = await Promise.all([
    snap.ref.collection("statusHistory").orderBy("at", "desc").get(),
    db.collection("refunds").where("bookingId", "==", params.id).get(),
    nameMap("newspapers", [b.newspaperId]), nameMap("locations", [b.locationId]),
    nameMap("categories", [b.categoryId]), nameMap("formats", [b.formatId]),
  ]);

  return (
    <Page eyebrow={b.reference} title={papers[b.newspaperId] ?? "Booking"}
      actions={<Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue"><ArrowLeft className="h-4 w-4" aria-hidden /> All bookings</Link>}>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={b.status} />
        <Badge tone={b.paymentStatus === "paid" ? "green" : "gold"}>Payment: {b.paymentStatus}</Badge>
        <span className="text-sm text-brand-muted">{locs[b.locationId]} · {cats[b.categoryId]} · {fmts[b.formatId]} · {fmtDate(b.publicationDate)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Advertisement">
            {b.artwork ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-bg p-4">
                <span className="flex items-center gap-3"><FileText className="h-6 w-6 text-brand-blue" aria-hidden /><span className="text-sm font-semibold text-brand-navy">{b.artwork.name}</span></span>
                <DownloadArtwork bookingId={b.id} />
              </div>
            ) : (
              <div className="paper rounded-xl border border-brand-border p-5">
                {b.content.headline && <p className="font-display text-lg font-bold text-brand-navy">{b.content.headline}</p>}
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{b.content.body}</p>
                <p className="mt-3 text-sm font-semibold text-brand-navy">{b.content.contact}</p>
                {b.content.website && <p className="mt-0.5 break-all text-xs text-brand-blue">{b.content.website}</p>}
              </div>
            )}
            {raw.content?.notes && <p className="mt-3 rounded-xl bg-brand-goldsoft p-3 text-xs text-brand-navy"><strong>Customer note:</strong> {raw.content.notes}</p>}
            {raw.artwork && <p className="mt-3 text-xs text-brand-muted">Virus scan: {raw.artwork.scan === "skipped" ? "not scanned (no scanner configured)" : raw.artwork.scan}.</p>}
          </Card>

          <Card title="History">
            <ol className="space-y-4 border-l-2 border-brand-border pl-5">
              {hist.docs.map((h) => {
                const x = h.data();
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-gold ring-4 ring-white" aria-hidden />
                    <p className="text-sm font-semibold text-brand-navy">{STATUS[x.to as keyof typeof STATUS]?.label ?? x.to}</p>
                    <p className="text-xs text-brand-muted">{x.actorRole} · {x.at?.toDate().toLocaleString("en-IN")}</p>
                    {x.reason && <p className="mt-1 rounded-lg bg-brand-bg p-2 text-xs">{x.reason}</p>}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Actions"><BookingActions id={b.id} status={b.status} paymentStatus={b.paymentStatus} totalMinor={b.totalMinor} /></Card>

          <Card title="Customer">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-brand-muted">Name</dt><dd className="font-medium">{c.name}</dd></div>
              <div><dt className="text-xs text-brand-muted">Email</dt><dd className="break-all font-medium">{c.email}</dd></div>
              <div><dt className="text-xs text-brand-muted">Mobile</dt><dd className="font-medium">{c.phone}</dd></div>
              {c.gstin && <div><dt className="text-xs text-brand-muted">GSTIN</dt><dd className="font-medium">{c.gstin}</dd></div>}
              <div><dt className="text-xs text-brand-muted">Account</dt><dd className="font-medium">{raw.customerId ? "Registered" : "Guest booking"}</dd></div>
            </dl>
          </Card>

          <Card title="Price at booking">
            <div className="space-y-1.5 text-sm">
              {b.pricing.lines.map((l) => <p key={l.label} className="flex justify-between gap-3"><span>{l.label}</span><span className="tabular-nums">{fmtMoney(l.amountMinor)}</span></p>)}
              {b.pricing.discountMinor > 0 && <p className="flex justify-between text-emerald-700"><span>Discount</span><span>−{fmtMoney(b.pricing.discountMinor)}</span></p>}
              <p className="flex justify-between"><span>Taxes</span><span className="tabular-nums">{fmtMoney(b.pricing.taxMinor)}</span></p>
              <p className="flex justify-between border-t border-brand-navy pt-2 font-bold text-brand-navy"><span>Total</span><span className="tabular-nums">{fmtMoney(b.totalMinor)}</span></p>
            </div>
            {refunds.docs.map((r) => <p key={r.id} className="mt-3 rounded-lg bg-brand-bg p-2 text-xs">Refunded {fmtMoney(r.data().amountMinor)} · ref {r.data().reference}</p>)}
          </Card>
        </div>
      </div>
    </Page>
  );
}