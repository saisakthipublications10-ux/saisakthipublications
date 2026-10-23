import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  ShieldCheck,
  Clock,
  FileCheck2,
  ListChecks,
  ChevronDown,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingLauncher } from "@/components/home/booking-launcher";
import { AdSamples } from "@/components/home/ad-samples";
import { NewspaperDirectory } from "@/components/home/newspaper-directory";

export const revalidate = 3600; // keeps the dateline fresh

const LOCATIONS = [
  { id: "kelambakkam", name: "Kelambakkam" },
  { id: "porur", name: "Porur" },
  { id: "vadapalani", name: "Vadapalani" },
  { id: "anna-nagar", name: "Anna Nagar" },
  { id: "chrompet", name: "Chrompet" },
];

const STEPS = [
  {
    icon: MapPin,
    title: "Choose your neighbourhood",
    text: "Start with where your audience lives. We show only the newspapers mapped to that area.",
  },
  {
    icon: CalendarDays,
    title: "Compose and pick a date",
    text: "Write your ad or upload artwork, then choose from live publication dates before the cut-off.",
  },
  {
    icon: ListChecks,
    title: "Pay and track",
    text: "Review an itemised price, pay securely, and follow every status from review to publication.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Transparent pricing",
    text: "An itemised breakdown (charge, add-ons, taxes, discount) before you pay.",
  },
  {
    icon: Clock,
    title: "Real cut-off rules",
    text: "Closed dates, holidays and passed deadlines are blocked automatically.",
  },
  {
    icon: FileCheck2,
    title: "Text or artwork",
    text: "Type your copy online or upload PDF, PNG or JPEG designs.",
  },
];

const FAQS = [
  {
    q: "Does every newspaper cover all five neighbourhoods?",
    a: "No. Each newspaper serves specific neighbourhoods set by the administrator. When you pick your location, only the eligible newspapers are shown.",
  },
  {
    q: "Can I type my ad or upload my own artwork?",
    a: "Both. You can compose text online with a live preview, or upload an existing design in an approved format that meets the newspaper's specifications.",
  },
  {
    q: "When is my publication date confirmed?",
    a: "Payment places your booking into review. Publication is confirmed only after review and confirmation with the newspaper, and your booking page always shows the current status.",
  },
  {
    q: "How is the price calculated?",
    a: "On our server, from the rate card configured for your newspaper, format, word count or area, colour option and applicable taxes. The figure you see before payment is itemised.",
  },
];

export default function HomePage() {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main" className="flex-1">
        {/* ───────── HERO ───────── */}
        <section className="relative overflow-hidden bg-brand-navy text-white">
          
          <div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-blue/30 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-40">
            {/* Dateline strip */}
            <div className="rule-double-light flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              <span>Chennai · {today}</span>
              <span className="hidden sm:inline">Local newspaper advertising, booked online</span>
            </div>

            <div className="mt-12 grid items-center gap-14 lg:mt-20 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="eyebrow animate-fade-up text-brand-gold">
                  Neighbourhood advertising
                </p>
                <h1 className="animate-fade-up delay-1 mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
                  Your Local Newspaper Ad,{" "}
                  <span className="italic text-brand-gold">Made Simple.</span>
                </h1>
                <p className="animate-fade-up delay-2 mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                  Choose your neighbourhood, select your newspaper, and book your advertisement
                  publication date online.
                </p>
                <div className="animate-fade-up delay-3 mt-9 flex flex-wrap gap-3">
                  <Link
                    href="/book"
                    className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-gold px-7 py-3 text-sm font-bold text-brand-navy shadow-lg shadow-black/20 transition-all hover:brightness-95"
                  >
                    Book Your Advertisement
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                  <Link
                    href="#newspapers"
                    className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Explore Newspapers
                  </Link>
                </div>
              </div>

              {/* Clipping composition (decorative, labelled as sample) */}
              <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden>
                <div className="paper absolute -left-6 top-10 w-60 -rotate-6 rounded-md p-4 text-brand-text shadow-clip">
                  <p className="eyebrow text-brand-blue">Classified</p>
                  <div className="mt-2 border-t-2 border-brand-navy pt-2">
                    <div className="h-2 w-3/4 rounded bg-brand-navy/80" />
                    <div className="mt-2 h-1.5 w-full rounded bg-brand-text/15" />
                    <div className="mt-1.5 h-1.5 w-11/12 rounded bg-brand-text/15" />
                    <div className="mt-1.5 h-1.5 w-2/3 rounded bg-brand-text/15" />
                  </div>
                </div>

                <div className="paper relative ml-16 mt-0 w-72 rotate-3 rounded-md p-5 text-brand-text shadow-clip">
                  <p className="eyebrow text-brand-blue">Display</p>
                  <div className="mt-3 rounded-sm bg-brand-navy px-4 py-6">
                    <p className="font-display text-xl font-semibold leading-tight text-white">
                      Your artwork,
                      <span className="block italic text-brand-gold">in print.</span>
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded bg-brand-text/15" />
                  <div className="mt-1.5 h-1.5 w-4/5 rounded bg-brand-text/15" />
                  <span className="absolute -right-3 -top-3 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy shadow">
                    Sample layout
                  </span>
                </div>

                <div className="relative -mt-2 ml-2 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-navy shadow-clip">
                  <span className="h-2 w-2 rounded-full bg-brand-gold" />
                  Pending Review
                  <ArrowRight className="h-3 w-3 text-brand-muted" />
                  <span className="text-brand-blue">Confirmed</span>
                  <ArrowRight className="h-3 w-3 text-brand-muted" />
                  <span className="text-brand-blue">Published</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── BOOKING WIDGET ───────── */}
        <section
          aria-label="Quick advertisement booking"
          className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:px-6 lg:-mt-24 lg:px-8"
        >
          <BookingLauncher />
        </section>

        {/* ───────── LOCATIONS: editorial index ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow text-brand-blue">Where we publish</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-brand-navy sm:text-4xl">
                Five neighbourhoods. One simple booking.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                Pick an area to see which newspapers are available there. Coverage is set by
                the administrator, so you only ever see valid combinations.
              </p>
            </div>

            <ol className="divide-y divide-brand-border border-y border-brand-navy">
              {LOCATIONS.map((loc, i) => (
                <li key={loc.id}>
                  <Link
                    href={`/book?location=${loc.id}`}
                    className="group flex items-center gap-5 py-5 transition-colors hover:bg-brand-card sm:gap-8 sm:px-3"
                  >
                    <span className="w-8 font-display text-sm text-brand-muted tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-2xl font-medium text-brand-navy transition-transform group-hover:translate-x-1 sm:text-3xl">
                      {loc.name}
                    </span>
                    <span className="hidden text-xs font-semibold text-brand-blue opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                      See newspapers
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 text-brand-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-navy"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── NEWSPAPERS: nameplates ───────── */}
        <section id="newspapers" className="scroll-mt-20 border-y border-brand-border bg-brand-card py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow text-brand-blue">Newspaper directory</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
                Four local publications
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                Locations, ad formats, schedules and rates for each newspaper are managed by the
                administrator and shown live in the booking flow.
              </p>
            </div>

            <NewspaperDirectory />
          </div>
        </section>

        {/* ───────── FORMATS ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand-blue">Advertisement formats</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
              From a few lines to a full display.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              Not every newspaper offers every format. The booking flow shows what is available
              for your selection.
            </p>
          </div>
          <div className="mt-10">
            <AdSamples />
            <p className="mt-4 text-xs text-brand-muted">
              Illustrative layouts only. They are not rate cards or print specifications.
            </p>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section id="how-it-works" className="scroll-mt-20 bg-brand-navy py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="eyebrow text-brand-gold">How it works</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
              Three steps from idea to print.
            </h2>

            <ol className="relative mt-14 grid gap-10 md:grid-cols-3">
              <div
                className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-gold/60 via-white/20 to-transparent md:block"
                aria-hidden
              />
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold/60 bg-brand-navy text-brand-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="mt-6 font-display text-sm text-brand-gold">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-bold">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── BENEFITS: bento ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="eyebrow text-brand-blue">Why book online</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
            Clear, checkable and under your control.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:grid-rows-2">
            <div className="rounded-2xl bg-brand-navy p-8 text-white md:col-span-2 md:row-span-1">
              <p className="eyebrow text-brand-gold">Status you can trust</p>
              <h3 className="mt-3 max-w-md font-display text-2xl font-semibold leading-snug">
                A booking is never shown as published until it actually is.
              </h3>
              <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                {["Pending Review", "Awaiting Newspaper Confirmation", "Confirmed", "Published"].map(
                  (s) => (
                    <li
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5"
                    >
                      <Check className="h-3 w-3 text-brand-gold" aria-hidden /> {s}
                    </li>
                  )
                )}
              </ul>
            </div>

            {BENEFITS.slice(0, 1).map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-card">
                <Icon className="h-6 w-6 text-brand-blue" aria-hidden />
                <h3 className="mt-4 text-base font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
              </div>
            ))}

            {BENEFITS.slice(1).map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-card">
                <Icon className="h-6 w-6 text-brand-blue" aria-hidden />
                <h3 className="mt-4 text-base font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
              </div>
            ))}

            <div className="rounded-2xl bg-brand-goldsoft p-7 md:col-span-1">
              <p className="eyebrow text-brand-navy/70">Your dashboard</p>
              <p className="mt-3 font-display text-lg font-semibold leading-snug text-brand-navy">
                Every booking, payment and receipt in one place.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-navy hover:underline"
              >
                View my bookings <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ───────── FAQ + CONTACT ───────── */}
        <section className="border-t border-brand-border bg-brand-card py-20">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-7">
              <p className="eyebrow text-brand-blue">FAQ</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
                Questions, answered plainly.
              </h2>

              <div className="mt-8 divide-y divide-brand-border border-y border-brand-navy">
                {FAQS.map((f) => (
                  <details key={f.q} className="group py-1">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDown
                        className="h-5 w-5 shrink-0 text-brand-muted transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <p className="pb-5 pr-9 text-sm leading-relaxed text-brand-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div id="contact" className="scroll-mt-24 lg:col-span-5">
              <div className="sticky top-24 overflow-hidden rounded-2xl bg-brand-navy p-8 text-white shadow-lift">
                <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
                <div className="relative">
                  <Mail className="h-6 w-6 text-brand-gold" aria-hidden />
                  <h2 className="mt-4 font-display text-2xl font-semibold">
                    Need help with a booking?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    For custom dimensions, public-notice documents or an existing order, contact
                    support and quote your booking reference (NT-…).
                  </p>
                  <p className="mt-4 rounded-lg border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-white/70">
                    Artwork accepted: PDF, PNG or JPEG. Files are validated on upload and must
                    meet the selected newspaper&apos;s specifications.
                  </p>
                  <Link
                    href="/book"
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-navy transition-all hover:brightness-95"
                  >
                    Start your booking <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}