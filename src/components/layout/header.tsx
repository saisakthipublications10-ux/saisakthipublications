import Link from "next/link";
import { Menu, X } from "lucide-react";
import { getSession } from "@/lib/auth";
import { SignOutButton, UserMenu } from "./user-menu";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book an Advertisement" },
  { href: "/#newspapers", label: "Newspapers" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#contact", label: "Contact" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="Saisakthi Publications home" className="flex items-center gap-2.5">
     <img src="/logo.png" alt="Sai Sakthi Publications" className="h-9 w-auto" />
      <span className={`text-[13px] font-extrabold leading-none tracking-[0.2em] ${light ? "text-white" : "text-brand-navy"}`}>
        SAISAKTHI
        <span className="mt-1 block text-[9px] font-semibold tracking-[0.22em] text-brand-gold">PUBLICATIONS</span>
      </span>
    </Link>
  );
}

export async function Header() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="text-sm font-medium text-brand-text/80 transition-colors hover:text-brand-navy">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                My Bookings
              </Link>
              <UserMenu name={user.name} email={user.email} />
            </>
          ) : (
            <Link href="/signin" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
              Sign In
            </Link>
          )}
          <Link href="/book" className="rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue">
            Book Now
          </Link>
        </div>
        <details className="group relative lg:hidden">
          <summary aria-label="Open menu"
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-brand-border [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 group-open:hidden" aria-hidden />
            <X className="hidden h-5 w-5 group-open:block" aria-hidden />
          </summary>
          <nav aria-label="Mobile" className="absolute right-0 top-14 w-72 rounded-xl border border-brand-border bg-white p-2 shadow-lift">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-brand-bg">
                {item.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-brand-border pt-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="block rounded-lg px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                    My Bookings
                  </Link>
                  <SignOutButton className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-brand-muted hover:bg-brand-bg" />
                </>
              ) : (
                <Link href="/signin" className="block rounded-lg px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
