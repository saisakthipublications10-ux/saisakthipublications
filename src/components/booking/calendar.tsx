"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateOpt } from "./types";
import { EmptyState } from "./ui";

const REASON: Record<string, string> = {
  holiday: "Holiday", closed: "Closed", full: "Fully booked", cutoff: "Cut-off passed",
};
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");

export function DateCalendar({
  options, value, onChange,
}: { options: DateOpt[]; value: string; onChange: (d: string) => void }) {
  const byDate = useMemo(() => new Map(options.map((o) => [o.date, o])), [options]);
  const months = useMemo(
    () => Array.from(new Set(options.map((o) => o.date.slice(0, 7)))),
    [options]
  );
  const [mi, setMi] = useState(0);

  useEffect(() => {
    const i = months.indexOf((value || options.find((o) => o.available)?.date || "").slice(0, 7));
    setMi(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  if (!months.length)
    return (
      <EmptyState
        title="No publication dates yet"
        text="This newspaper has no publication dates configured. Please choose another newspaper or contact support."
      />
    );

  const [y, m] = months[mi].split("-").map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const label = new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setMi((i) => i - 1)} disabled={mi === 0}
          aria-label="Previous month"
          className="grid h-11 w-11 place-items-center rounded-full border border-brand-border hover:bg-brand-bg disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-display text-xl font-semibold text-brand-navy" aria-live="polite">{label}</h3>
        <button type="button" onClick={() => setMi((i) => i + 1)} disabled={mi === months.length - 1}
          aria-label="Next month"
          className="grid h-11 w-11 place-items-center rounded-full border border-brand-border hover:bg-brand-bg disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DOW.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-bold uppercase tracking-wider text-brand-muted">{d}</span>
        ))}
        {Array.from({ length: lead }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const iso = `${y}-${pad(m)}-${pad(d)}`;
          const o = byDate.get(iso);
          const selected = value === iso;
          const aria = `${new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}: ${
            o ? (o.available ? "available" : REASON[o.reason ?? ""] ?? "unavailable") : "no edition"
          }`;
          return (
            <button
              key={iso}
              type="button"
              disabled={!o?.available}
              aria-label={aria}
              aria-pressed={selected}
              title={o && !o.available ? REASON[o.reason ?? ""] : undefined}
              onClick={() => onChange(iso)}
              className={`relative grid aspect-square min-h-11 place-items-center rounded-xl text-sm font-semibold transition-all
                ${selected
                  ? "bg-brand-navy text-brand-gold shadow-card ring-2 ring-brand-gold ring-offset-2"
                  : o?.available
                  ? "bg-brand-goldsoft text-brand-navy hover:bg-brand-gold/40"
                  : o
                  ? "text-brand-muted/50 line-through"
                  : "text-brand-muted/30"}
                disabled:cursor-not-allowed`}
            >
              {d}
              {o && o.available && o.surchargeMinor > 0 && !selected && (
                <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-blue" />
              )}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-border pt-4 text-xs text-brand-muted">
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-brand-goldsoft ring-1 ring-brand-gold/50" /> Available</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-brand-navy" /> Selected</li>
        <li className="flex items-center gap-2"><span className="font-semibold line-through">12</span> Unavailable</li>
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-blue" /> Date surcharge applies</li>
      </ul>
    </div>
  );
}