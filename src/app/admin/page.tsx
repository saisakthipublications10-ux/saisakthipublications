import Link from "next/link";
import { Timestamp, type Query } from "firebase-admin/firestore";
import { CheckCircle2, ClipboardList, Clock, Inbox, Sparkles, Wallet } from "lucide-react";
import { Badge, Card, Page, Stat, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/dashboard/status";
import { fmtDate } from "@/components/booking/types";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { istToday } from "@/lib/admin";
import { fmtMoney, nameMap, toBookingView } from "@/lib/bookings-read";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const count = (q: Query) => q.count().get().then((s) => s.data().count);

export default async function AdminHome() {
  await requireAdmin("/admin");
  const bookings = db.collection("bookings");
  const status = (s: string) => bookings.where("status", "==", s);
  const weekAgo = Timestamp.fromMillis(Date.now() - 7 * 86400000);

  const [total, fresh, pendingPay, review, awaiting, confirmed, cancelReq, refundPend, openSupport, revenue, upcoming, recent, logs] =
    await Promise.all([
      count(bookings),
      count(bookings.where("createdAt", ">=", weekAgo)),
      count(status("pending_payment")),
      count(status("pending_review")),
      count(status("awaiting_newspaper_confirmation")),
      count(status("confirmed")),
      count(status("cancellation_requested")),
      count(status("refund_pending")),
      count(db.collection("supportMessages").where("status", "==", "open")),
      bookings.where("paymentStatus", "==", "paid").select("totalMinor").get()
        .then((snap) => snap.docs.reduce((sum, doc) => {
          const amount = doc.get("totalMinor");
          return typeof amount === "number" && Number.isFinite(amount) ? sum + amount : sum;
        }, 0)),
      bookings.where("status", "in", ["pending_review", "awaiting_newspaper_confirmation", "confirmed"])
        .where("publicationDate", ">=", istToday()).orderBy("publicationDate").limit(8).get(),
      bookings.orderBy("createdAt", "desc").limit(6).get(),
      db.collection("auditLogs").orderBy("at", "desc").limit(6).get(),
    ]);

  const upRows = upcoming.docs.map(toBookingView);
  const recentRows = recent.docs.map(toBookingView);
  const papers = await nameMap("newspapers", [...upRows, ...recentRows].map((r) => r.newspaperId));

  const queue = [
    { label: "Pending review", n: review, href: "/admin/bookings?status=pending_review" },
    { label: "Awaiting newspaper confirmation", n: awaiting, href: "/admin/bookings?status=awaiting_newspaper_confirmation" },
    { label: "Cancellation requests", n: cancelReq, href: "/admin/bookings?status=cancellation_requested" },
    { label: "Refunds to process", n: refundPend, href: "/admin/bookings?status=refund_pending" },
    { label: "Open support messages", n: openSupport, href: "/admin/support" },
  ].filter((q) => q.n > 0);

  return (
    <Page eyebrow="Administration" title="Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Total bookings" value={total} icon={ClipboardList} href="/admin/bookings" />
        <Stat label="New this week" value={fresh} icon={Sparkles} />
        <Stat label="Pending payment" value={pendingPay} icon={Clock} href="/admin/bookings?status=pending_payment" />
        <Stat label="Pending approval" value={review} icon={Inbox} href="/admin/bookings?status=pending_review" />
        <Stat label="Confirmed publications" value={confirmed} icon={CheckCircle2} href="/admin/bookings?status=confirmed" />
        <Stat label="Revenue (verified payments)" value={fmtMoney(revenue)} icon={Wallet} />
      </div>

      <Card title="Needs your action">
        {queue.length === 0 ? (
          <p className="text-sm text-brand-muted">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {queue.map((q) => (
              <li key={q.label}>
                <Link href={q.href} className="flex items-center justify-between py-3 hover:text-brand-blue">
                  <span className="text-sm font-medium text-brand-navy">{q.label}</span>
                  <Badge tone="gold">{q.n}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming publication dates" aside={<Link href="/admin/availability" className="text-xs font-semibold text-brand-blue">Availability</Link>}>
          {upRows.length === 0 ? <p className="text-sm text-brand-muted">Nothing scheduled.</p> : (
            <table className="w-full">
              <thead><tr><th className={th}>Date</th><th className={th}>Newspaper</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-brand-border">
                {upRows.map((b) => (
                  <tr key={b.id}>
                    <td className={td}>{fmtDate(b.publicationDate)}</td>
                    <td className={td}><Link className="font-medium text-brand-blue hover:underline" href={`/admin/bookings/${b.id}`}>{papers[b.newspaperId]}</Link></td>
                    <td className={td}><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Recent customer activity" aside={<Link href="/admin/bookings" className="text-xs font-semibold text-brand-blue">All bookings</Link>}>
          {recentRows.length === 0 ? <p className="text-sm text-brand-muted">No bookings yet.</p> : (
            <ul className="divide-y divide-brand-border">
              {recentRows.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-brand-navy">{b.reference}</span>
                      <span className="block truncate text-xs text-brand-muted">{papers[b.newspaperId]} · {fmtMoney(b.totalMinor)}</span>
                    </span>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent admin actions" aside={<Link href="/admin/audit" className="text-xs font-semibold text-brand-blue">Full log</Link>}>
        <ul className="divide-y divide-brand-border text-sm">
          {logs.docs.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2.5">
              <span><span className="font-semibold text-brand-navy">{l.data().action}</span> <span className="text-brand-muted">{l.data().target}</span></span>
              <span className="text-xs text-brand-muted">{l.data().actorEmail ?? l.data().actor}</span>
            </li>
          ))}
          {logs.empty && <li className="py-2 text-brand-muted">No actions recorded yet.</li>}
        </ul>
      </Card>
    </Page>
  );
}