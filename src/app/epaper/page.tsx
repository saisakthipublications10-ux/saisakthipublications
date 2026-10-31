import Link from "next/link";
import type { Query } from "firebase-admin/firestore";
import { AlertCircle, BookOpen, Download, Newspaper } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EpaperCover } from "@/components/epaper/cover";
import { IssueCard } from "@/components/epaper/issue-card";
import { db } from "@/lib/firebase-admin";
import { nameMap } from "@/lib/bookings-read";
import { toEpaperView, todayIST, type EpaperView } from "@/lib/epaper";
import { fmtSize, longDate, shortDate } from "@/lib/epaper-shared";

export const metadata = {
  title: "E-Paper: read and download",
  description: "Read or download the latest editions of our local newspapers as PDF, and browse the archive.",
};
export const dynamic = "force-dynamic";

const PAGE = 12;
interface SP { paper?: string; month?: string; after?: string; notice?: string }

const NOTICES: Record<string, string> = {
  unavailable: "That issue isn't available any more.",
  slow: "Too many downloads from your network. Please try again in a little while.",
};

export default async function EpaperPage({ searchParams }: { searchParams: SP }) {
  const today = todayIST();

  const papersSnap = await db.collection("newspapers").where("active", "==", true).get();
  const papers = papersSnap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const paper = papers.some((p) => p.id === searchParams.paper) ? searchParams.paper! : "";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.month ?? "") ? searchParams.month! : "";

  let rows: EpaperView[] = [];
  let hasMore = false;
  let failed = false;
  try {
    let q: Query = db.collection("epapers").where("status", "==", "published");
    if (paper) q = q.where("newspaperId", "==", paper);
    if (month) q = q.where("issueDate", ">=", `${month}-01`).where("issueDate", "<=", `${month}-31`);
    q = q.orderBy("issueDate", "desc").limit(PAGE + 1);
    if (searchParams.after) {
      const c = await db.collection("epapers").doc(searchParams.after).get();
      if (c.exists && c.data()!.status === "published") q = q.startAfter(c);
    }
    const snap = await q.get();
    hasMore = snap.docs.length > PAGE;
    rows = snap.docs.slice(0, PAGE).map(toEpaperView);
  } catch (e) {
    console.error("[epaper]", e instanceof Error ? e.message : "unknown error"); // usually a missing index
    failed = true;
  }

  const names = await nameMap("newspapers", rows.map((r) => r.newspaperId));
  const featured = !searchParams.after && !month ? rows[0] : undefined;
  const rest = featured ? rows.slice(1) : rows;

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  });

  const href = (o: Partial<SP>) => {
    const v = { paper, month, ...o };
    const p = new URLSearchParams();
    if (v.paper) p.set("paper", v.paper);
    if (v.month) p.set("month", v.month);
    if (v.after) p.set("after", v.after);
    const s = p.toString();
    return `/epaper${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden bg-brand-navy text-white">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
            <div className="rule-double-light flex flex-wrap justify-between gap-2 pt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              <span>{longDate(today)}</span>
              <span>Digital editions</span>
            </div>
            <p className="eyebrow mt-12 text-brand-gold">E-Paper</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Today&apos;s paper, <span className="italic text-brand-gold">wherever you are.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">
              Read the latest edition online or download it as a PDF. Past issues are kept in the archive below.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="rounded-2xl border border-brand-border bg-white p-3 shadow-lift sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Newspapers" className="flex gap-2 overflow-x-auto">
                {[{ id: "", name: "All newspapers" }, ...papers].map((p) => (
                  <Link key={p.id || "all"} href={href({ paper: p.id, after: undefined })}
                    aria-current={paper === p.id ? "page" : undefined}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      paper === p.id ? "bg-brand-navy text-white" : "text-brand-muted hover:bg-brand-bg hover:text-brand-navy"}`}>
                    {p.name}
                  </Link>
                ))}
              </nav>
              <form action="/epaper" className="flex items-center gap-2">
                {paper && <input type="hidden" name="paper" value={paper} />}
                <label htmlFor="month" className="sr-only">Month</label>
                <select id="month" name="month" defaultValue={month}
                  className="min-h-10 rounded-xl border border-brand-border bg-white px-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                  <option value="">Any month</option>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <button className="min-h-10 rounded-xl bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-brand-blue">Apply</button>
                {(month || paper) && <Link href="/epaper" className="px-2 text-sm font-semibold text-brand-blue">Clear</Link>}
              </form>
            </div>
          </div>

          {searchParams.notice && NOTICES[searchParams.notice] && (
            <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-brand-gold/60 bg-brand-goldsoft p-3 text-sm font-medium text-brand-navy">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {NOTICES[searchParams.notice]}
            </p>
          )}

          {failed ? (
            <p className="mt-8 rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-brand-muted">
              The e-paper is temporarily unavailable. Please try again in a few minutes.
            </p>
          ) : rows.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
              <Newspaper className="mx-auto h-8 w-8 text-brand-blue" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold text-brand-navy">No issues here yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-muted">
                {paper || month ? "No published issues match these filters." : "New editions will appear here as soon as they are published."}
              </p>
              {(paper || month) && (
                <Link href="/epaper" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-navy px-6 text-sm font-semibold text-white hover:bg-brand-blue">
                  Show all issues
                </Link>
              )}
            </div>
          ) : (
            <>
              {featured && (
                <section aria-label="Latest edition" className="mt-8 grid gap-8 overflow-hidden rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:p-8 md:grid-cols-[280px_1fr]">
                  <div className="mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-lg border border-brand-border shadow-lift md:mx-0">
                    <EpaperCover id={featured.id} hasCover={featured.hasCover} paper={names[featured.newspaperId]} date={shortDate(featured.issueDate)} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="eyebrow text-brand-blue">Latest edition</p>
                      {featured.issueDate === today && (
                        <span className="rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy">Today</span>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-brand-navy sm:text-4xl">
                      {names[featured.newspaperId]}
                    </h2>
                    <p className="mt-1 text-base text-brand-text/80">
                      {longDate(featured.issueDate)}{featured.edition ? ` · ${featured.edition}` : ""}
                    </p>
                    {featured.title && <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-muted">{featured.title}</p>}
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={`/api/epaper/${featured.id}/download`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-gold px-7 text-sm font-bold text-brand-navy shadow-sm hover:brightness-95">
                        <Download className="h-4 w-4" aria-hidden /> Download PDF
                      </a>
                      <a href={`/api/epaper/${featured.id}/download?view=1`} target="_blank" rel="noopener"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-border px-7 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                        <BookOpen className="h-4 w-4" aria-hidden /> Read online
                      </a>
                    </div>
                    <p className="mt-4 text-xs text-brand-muted">PDF · {fmtSize(featured.size)}</p>
                  </div>
                </section>
              )}

              {rest.length > 0 && (
                <section aria-label="Archive" className="mt-12">
                  <h2 className="border-b-[3px] border-double border-brand-navy pb-3 font-display text-2xl font-semibold text-brand-navy">
                    {featured ? "Archive" : "Issues"}
                  </h2>
                  <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {rest.map((r) => (
                      <li key={r.id}><IssueCard issue={r} paper={names[r.newspaperId]} /></li>
                    ))}
                  </ul>
                </section>
              )}

              {hasMore && (
                <div className="mt-10 text-center">
                  <Link href={href({ after: rows[rows.length - 1].id })}
                    className="inline-flex min-h-11 items-center rounded-xl border border-brand-border bg-white px-6 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                    Show older issues
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}