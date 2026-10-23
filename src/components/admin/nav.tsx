"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, ClipboardList, ExternalLink, IndianRupee, LayoutDashboard, LifeBuoy,
  MapPin, Newspaper, ScrollText, Tags,
} from "lucide-react";
import { SignOutButton } from "@/components/layout/user-menu";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/newspapers", label: "Newspapers", icon: Newspaper },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/availability", label: "Availability", icon: CalendarDays },
  { href: "/admin/pricing", label: "Pricing", icon: IndianRupee },
  { href: "/admin/catalog", label: "Catalog", icon: Tags },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

function Mark() {
  return (
    <img src="/logo.png" alt="Sai Sakthi Publications" className="h-9 w-auto" />
  );
}       

export function AdminNav({ email }: { email: string | null }) {
  const path = usePathname();
  const on = (i: (typeof ITEMS)[number]) => (i.exact ? path === i.href : path.startsWith(i.href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-brand-deep text-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 pt-6">
          <Mark />
          <div>
            <p className="text-[12px] font-extrabold leading-none tracking-[0.2em]">SAISAKTHI</p>
            <p className="mt-1 text-[9px] font-semibold tracking-[0.35em] text-brand-gold">PUBLICATIONS ADMIN</p>
          </div>
        </div>
        <nav aria-label="Admin" className="mt-8 flex-1 space-y-1 overflow-y-auto px-3">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} aria-current={on(i) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                on(i) ? "border-brand-gold bg-white/10 text-white" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}>
              <i.icon className="h-4 w-4" aria-hidden /> {i.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4 text-xs">
          <p className="truncate text-white/60">{email}</p>
          <Link href="/" className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View site
          </Link>
          <SignOutButton className="text-white/70 hover:text-white" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 bg-brand-deep text-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2"><Mark /><span className="text-xs font-bold tracking-[0.18em]">ADMIN</span></div>
          <SignOutButton className="text-xs text-white/70" />
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} aria-current={on(i) ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${on(i) ? "bg-brand-gold text-brand-navy" : "bg-white/10 text-white/80"}`}>
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}