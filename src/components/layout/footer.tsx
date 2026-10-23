import Link from "next/link";
import { Logo } from "./header";

export function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="rule-double-light" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Logo light />
          <p className="mt-5 max-w-sm font-display text-xl leading-snug text-white/90">
            Your Local Newspaper Ad, Made Simple.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Online booking and coordination of local newspaper advertisements across
            selected Chennai neighbourhoods.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="eyebrow text-brand-gold">Platform</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" href="/book">Book an Advertisement</Link></li>
              <li><Link className="hover:text-white" href="/#newspapers">Newspapers</Link></li>
              <li><Link className="hover:text-white" href="/#how-it-works">How It Works</Link></li>
              <li><Link className="hover:text-white" href="/dashboard">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-brand-gold">Policies</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" href="/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-white" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-white" href="/refunds">Cancellation &amp; Refunds</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="eyebrow text-brand-gold">Support</p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Include your booking reference (NT-…) when you contact us about an
              existing order.
            </p>
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Saisakthi Publications. All rights reserved.</p>
          <p>Publication dates are confirmed only after review and newspaper confirmation.</p>
        </div>
      </div>
    </footer>
  );
}