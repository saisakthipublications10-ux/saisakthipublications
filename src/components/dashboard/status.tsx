import { STATUS, type Tone } from "@/lib/booking-status";
import type { BookingStatus } from "@/lib/types";

const TONE: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  gold: "bg-brand-goldsoft text-brand-navy ring-brand-gold/60",
  blue: "bg-sky-50 text-brand-blue ring-sky-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  red: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const current = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${TONE[current.tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {current.label}
    </span>
  );
}

export function DateBlock({ iso, large = false }: { iso: string; large?: boolean }) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const weekday = date.toLocaleDateString("en-IN", { weekday: "short" });
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl border border-brand-border bg-white text-center shadow-card ${large ? "w-24" : "w-16"}`}>
      <div className="bg-brand-navy py-1 text-[10px] font-bold tracking-[0.18em] text-brand-gold">{monthName}</div>
      <div className={`font-display font-semibold leading-none text-brand-navy ${large ? "pt-3 text-5xl" : "pt-2 text-3xl"}`}>{day}</div>
      <div className={`pb-2 text-brand-muted ${large ? "pt-1 text-xs" : "pt-0.5 text-[10px]"}`}>{weekday} · {year}</div>
    </div>
  );
}
