import Link from "next/link";
import { AlertCircle, ArrowRight, Newspaper } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingCard } from "@/components/dashboard/booking-card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { nameMap, toBookingView } from "@/lib/bookings-read";
import { STATUS, VIEWS, statusesFor } from "@/lib/booking-status";

export const metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Dashboard({ searchParams }: { searchParams: { view?: string; after?: string } }) {
  const user = await requireUser("/dashboard");
  const view = VIEWS.some((item) => item.id === searchParams.view) ? searchParams.view! : "all";
  const statuses = statusesFor(view);
  const mine = db.collection("bookings").where("customerId", "==", user.uid);
  let query = (statuses ? mine.where("status", "in", statuses) : mine)
    .orderBy("createdAt", "desc")
    .limit(PAGE_SIZE + 1);

  if (searchParams.after) {
    const cursor = await db.collection("bookings").doc(searchParams.after).get();
    if (cursor.exists && cursor.data()?.customerId === user.uid) query = query.startAfter(cursor);
  }

  const actionStatuses = statusesFor("action")!;
  const [snapshot, totalSnapshot, actionSnapshot] = await Promise.all([
    query.get(),
    mine.count().get(),
    mine.where("status", "in", actionStatuses).orderBy("createdAt", "desc").limit(3).get(),
  ]);
  const hasMore = snapshot.docs.length > PAGE_SIZE;
  const rows = snapshot.docs.slice(0, PAGE_SIZE).map(toBookingView);
  const actionRows = actionSnapshot.docs.map(toBookingView);
  const allRows = [...rows, ...actionRows];
  const [papers, locations] = await Promise.all([
    nameMap("newspapers", allRows.map((row) => row.newspaperId)),
    nameMap("locations", allRows.map((row) => row.locationId)),
  ]);
  const name = (user.name || user.email || "there").split(/[ @]/)[0];
  const count = totalSnapshot.data().count;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden bg-brand-navy text-white">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
            <div>
              <p className="eyebrow text-brand-gold">My bookings</p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Welcome back, <span className="italic text-brand-gold">{name}.</span>
              </h1>
              <p className="mt-3 text-sm text-white/70">
                {count === 0 ? "You haven't made a booking yet." : `${count} ${count === 1 ? "booking" : "bookings"} in total.`}
              </p>
            </div>
            <Link href="/book"
              className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-gold px-7 text-sm font-bold text-brand-navy shadow-lg shadow-black/20 hover:brightness-95">
              New booking <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </section>
        <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          {actionRows.length > 0 && view === "all" && (
            <section aria-label="Needs your attention" className="mb-6 rounded-2xl border border-brand-gold/60 bg-brand-goldsoft p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                <AlertCircle className="h-4 w-4" aria-hidden /> Needs your attention
              </h2>
              <ul className="mt-3 divide-y divide-brand-gold/30">
                {actionRows.map((booking) => (
                  <li key={booking.id}>
                    <Link href={`/dashboard/${booking.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:underline">
                      <span className="text-sm font-semibold text-brand-navy">
                        {booking.reference} · {papers[booking.newspaperId] ?? booking.newspaperId}
                      </span>
                      <span className="text-sm text-brand-navy/80">{STATUS[booking.status].label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <nav aria-label="Filter bookings" className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-brand-border bg-white p-2 shadow-card">
            {VIEWS.map((item) => (
              <Link key={item.id} href={item.id === "all" ? "/dashboard" : `/dashboard?view=${item.id}`}
                aria-current={view === item.id ? "page" : undefined}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  view === item.id ? "bg-brand-navy text-white" : "text-brand-muted hover:bg-brand-bg hover:text-brand-navy"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
              <Newspaper className="mx-auto h-8 w-8 text-brand-blue" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold text-brand-navy">
                {view === "all" ? "No bookings yet" : "Nothing here"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-muted">
                {view === "all"
                  ? "When you book an advertisement it will appear here with its live status."
                  : "No bookings match this filter."}
              </p>
              <Link href={view === "all" ? "/book" : "/dashboard"}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-navy px-6 text-sm font-semibold text-white hover:bg-brand-blue">
                {view === "all" ? "Book an advertisement" : "Show all bookings"}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {rows.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} paper={papers[booking.newspaperId] ?? booking.newspaperId}
                    location={locations[booking.locationId] ?? booking.locationId} />
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <div className="mt-8 text-center">
              <Link href={`/dashboard?${view !== "all" ? `view=${view}&` : ""}after=${rows[rows.length - 1].id}`}
                className="inline-flex min-h-11 items-center rounded-xl border border-brand-border bg-white px-6 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                Show older bookings
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
