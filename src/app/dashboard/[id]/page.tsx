import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StatusBadge, DateBlock } from "@/components/dashboard/status";
import { CancelBooking, DownloadArtwork, SupportForm } from "@/components/dashboard/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { fmtMoney, nameMap, toBookingView } from "@/lib/bookings-read";
import { IMMEDIATE_CANCEL, REQUESTABLE_CANCEL, STATUS } from "@/lib/booking-status";
import type { BookingStatus } from "@/lib/types";

export const metadata = { title: "Booking details" };
export const dynamic = "force-dynamic";

const TRACK = ["Payment", "Review", "Newspaper", "Confirmed", "Published"];
const POSITION: Partial<Record<BookingStatus, number>> = {
  draft: 0,
  pending_payment: 0,
  payment_failed: 0,
  pending_review: 1,
  artwork_required: 1,
  awaiting_newspaper_confirmation: 2,
  confirmed: 3,
  published: 4,
};
const PAYMENT: Record<string, string> = {
  pending: "Not received",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  refund_pending: "Refund pending",
};

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const user = await requireUser(`/dashboard/${params.id}`);
  const snapshot = await db.collection("bookings").doc(params.id).get();
  if (!snapshot.exists || snapshot.data()?.customerId !== user.uid) notFound();

  const booking = toBookingView(snapshot);
  const [history, papers, locations, categories, formats] = await Promise.all([
    snapshot.ref.collection("statusHistory").orderBy("at", "asc").get(),
    nameMap("newspapers", [booking.newspaperId]),
    nameMap("locations", [booking.locationId]),
    nameMap("categories", [booking.categoryId]),
    nameMap("formats", [booking.formatId]),
  ]);
  const statusInfo = STATUS[booking.status];
  const position = POSITION[booking.status];
  const hasTrack = position !== undefined;
  const warning = booking.status === "artwork_required" || booking.status === "payment_failed";
  const canCancel = IMMEDIATE_CANCEL.includes(booking.status);
  const canRequestCancel = REQUESTABLE_CANCEL.includes(booking.status);
  const timeline = history.docs.map((doc) => {
    const item = doc.data();
    return {
      id: doc.id,
      to: item.to as BookingStatus,
      reason: item.reason as string | null,
      at: item.at?.toDate().toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
      }) ?? "",
    };
  }).reverse();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden bg-brand-navy text-white">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden /> All bookings
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <DateBlock iso={booking.publicationDate} large />
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold">{booking.reference}</p>
                <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{papers[booking.newspaperId]}</h1>
                <p className="mt-1 text-sm text-white/70">{locations[booking.locationId]} · {formats[booking.formatId]}</p>
                <div className="mt-3"><StatusBadge status={booking.status} /></div>
              </div>
            </div>
          </div>
        </section>
        <div className="relative z-10 mx-auto -mt-12 grid max-w-5xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
              <p className="eyebrow text-brand-blue">What happens next</p>
              <p className={`mt-2 text-sm leading-relaxed ${warning ? "font-semibold text-brand-navy" : "text-brand-text"}`}>
                {statusInfo.next}
              </p>
              {hasTrack && (
                <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Booking progress">
                  {TRACK.map((label, index) => {
                    const done = index < position! || booking.status === "published";
                    const current = index === position! && booking.status !== "published";
                    return (
                      <li key={label} className="text-center" aria-current={current ? "step" : undefined}>
                        <div className="flex items-center">
                          <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : done || current ? "bg-brand-gold" : "bg-brand-border"}`} />
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            done ? "bg-brand-gold text-brand-navy"
                              : current ? `${warning ? "bg-amber-500" : "bg-brand-navy"} text-white ring-4 ring-brand-gold/30`
                                : "border border-brand-border bg-white text-brand-muted"}`}>
                            {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                          </span>
                          <span className={`h-px flex-1 ${index === TRACK.length - 1 ? "bg-transparent" : done ? "bg-brand-gold" : "bg-brand-border"}`} />
                        </div>
                        <p className={`mt-2 text-[11px] font-semibold sm:text-xs ${current ? "text-brand-navy" : "text-brand-muted"}`}>{label}</p>
                        <span className="sr-only">{done ? "completed" : current ? "current" : "upcoming"}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-brand-navy">Your advertisement</h2>
              <p className="mt-1 text-xs text-brand-muted">{categories[booking.categoryId]}</p>
              {booking.artwork ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-bg p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-6 w-6 shrink-0 text-brand-blue" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-navy">{booking.artwork.name}</p>
                      <p className="text-xs text-brand-muted">{(booking.artwork.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <DownloadArtwork bookingId={booking.id} />
                </div>
              ) : (
                <div className="paper mt-4 rounded-xl border border-brand-border p-5">
                  {booking.content.headline && <p className="font-display text-lg font-bold text-brand-navy">{booking.content.headline}</p>}
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-brand-text/85">{booking.content.body}</p>
                  <p className="mt-3 text-sm font-semibold text-brand-navy">{booking.content.contact}</p>
                  {booking.content.website && <p className="mt-0.5 break-all text-xs text-brand-blue">{booking.content.website}</p>}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-brand-navy">History</h2>
              <ol className="mt-5 space-y-5 border-l-2 border-brand-border pl-6">
                {timeline.map((item, index) => (
                  <li key={item.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${index === 0 ? "bg-brand-gold" : "bg-brand-border"}`} aria-hidden />
                    <p className="text-sm font-semibold text-brand-navy">{STATUS[item.to].label}</p>
                    <p className="text-xs text-brand-muted">{item.at}</p>
                    {item.reason && <p className="mt-1 rounded-lg bg-brand-bg p-2.5 text-xs leading-relaxed text-brand-text/85">{item.reason}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
              <div className="border-b-[3px] border-double border-brand-navy pb-3">
                <h2 className="font-display text-xl font-semibold text-brand-navy">Price at booking</h2>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {booking.pricing.lines.map((line) => (
                  <p key={line.label} className="flex justify-between gap-4">
                    <span className="text-brand-text/80">{line.label}</span>
                    <span className="tabular-nums">{fmtMoney(line.amountMinor)}</span>
                  </p>
                ))}
                {booking.pricing.discountMinor > 0 && (
                  <p className="flex justify-between text-emerald-700">
                    <span>Discount</span><span className="tabular-nums">−{fmtMoney(booking.pricing.discountMinor)}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <span className="text-brand-text/80">Taxes</span><span className="tabular-nums">{fmtMoney(booking.pricing.taxMinor)}</span>
                </p>
                <p className="mt-3 flex items-baseline justify-between border-t border-brand-navy pt-3">
                  <span className="font-bold text-brand-navy">Total</span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-brand-navy">{fmtMoney(booking.totalMinor)}</span>
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-bg px-4 py-3 text-sm">
                <span className="text-brand-muted">Payment</span>
                <span className="font-semibold text-brand-navy">{PAYMENT[booking.paymentStatus] ?? booking.paymentStatus}</span>
              </div>
            </section>
            {(canCancel || canRequestCancel) && (
              <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
                <CancelBooking bookingId={booking.id} immediate={canCancel} />
                <p className="mt-3 text-xs text-brand-muted">
                  See our <Link href="/refunds" className="font-semibold text-brand-blue underline">cancellation &amp; refund policy</Link>.
                </p>
              </section>
            )}
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
              <SupportForm bookingId={booking.id} reference={booking.reference} />
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
