import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge, DateBlock } from "./status";
import { fmtMoney, type BookingView } from "@/lib/bookings-read";

export function BookingCard({ booking, paper, location }: { booking: BookingView; paper: string; location: string }) {
  return (
    <Link href={`/dashboard/${booking.id}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-brand-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-navy sm:gap-6 sm:p-5">
      <DateBlock iso={booking.publicationDate} />
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wider text-brand-muted">{booking.reference}</p>
        <p className="mt-0.5 truncate font-display text-lg font-semibold text-brand-navy sm:text-xl">{paper}</p>
        <p className="truncate text-sm text-brand-muted">{location}</p>
        <div className="mt-2"><StatusBadge status={booking.status} /></div>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div className="hidden sm:block">
          <p className="text-xs text-brand-muted">Total</p>
          <p className="font-display text-lg font-semibold tabular-nums text-brand-navy">{fmtMoney(booking.totalMinor)}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-brand-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-navy" aria-hidden />
      </div>
    </Link>
  );
}
