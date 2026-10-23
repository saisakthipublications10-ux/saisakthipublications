"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { formatINR } from "../../lib/money";
import { Draft, Quote, QuoteStatus, fmtDate } from "./types";

export interface Names { location?: string; paper?: string; category?: string; format?: string }

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-brand-muted">{label}</dt>
      <dd className={`text-right text-sm font-semibold ${value ? "text-brand-navy" : "text-brand-muted/50"}`}>
        {value || "Not selected"}
      </dd>
    </div>
  );
}

function SummaryBody(props: {
  draft: Draft; names: Names; words: number; area: number;
  quote: Quote | null; status: QuoteStatus; error: string;
}) {
  const { draft, names, words, area, quote, status, error } = props;
  const size = area > 0 ? `${draft.widthCm} × ${draft.heightCm} cm` : words > 0 ? `${words} words` : undefined;
  return (
    <>
      <dl className="divide-y divide-brand-border">
        <Row label="Location" value={names.location} />
        <Row label="Newspaper" value={names.paper} />
        <Row label="Format" value={names.format ? `${names.format}${names.category ? ` · ${names.category}` : ""}` : undefined} />
        <Row label="Size" value={size} />
        <Row label="Date" value={draft.date ? fmtDate(draft.date) : undefined} />
      </dl>

      <div className="mt-5 rounded-xl bg-brand-bg p-4" aria-live="polite">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-brand-blue">Price</p>
          <span className="rounded-full bg-brand-goldsoft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
            Estimate
          </span>
        </div>

        {status === "idle" && (
          <p className="mt-3 text-sm text-brand-muted">
            Choose a format, add your content and pick a date to see an itemised price.
          </p>
        )}
        {status === "loading" && (
          <div className="mt-3 space-y-2" aria-label="Calculating price">
            <div className="h-4 w-full animate-pulse rounded bg-brand-border" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-brand-border" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-brand-border" />
          </div>
        )}
        {status === "error" && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>
        )}
        {status === "ok" && quote && (
          <div className="mt-3 space-y-1.5 text-sm">
            {quote.lines.map((l) => (
              <p key={l.label} className="flex justify-between gap-4">
                <span className="text-brand-text/80">{l.label}</span>
                <span className="tabular-nums">{formatINR(l.amountMinor)}</span>
              </p>
            ))}
            {quote.discountMinor > 0 && (
              <p className="flex justify-between text-emerald-700">
                <span>Discount</span><span className="tabular-nums">−{formatINR(quote.discountMinor)}</span>
              </p>
            )}
            <p className="flex justify-between gap-4">
              <span className="text-brand-text/80">Taxes</span>
              <span className="tabular-nums">{formatINR(quote.taxMinor)}</span>
            </p>
            <p className="mt-3 flex items-baseline justify-between border-t border-brand-navy pt-3">
              <span className="font-bold text-brand-navy">Total payable</span>
              <span className="font-display text-2xl font-semibold tabular-nums text-brand-navy">
                {formatINR(quote.totalMinor)}
              </span>
            </p>
            <p className="pt-1 text-[11px] leading-relaxed text-brand-muted">
              Final price is recalculated on our server when you confirm.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

type SharedProps = Parameters<typeof SummaryBody>[0];

export function SummaryCard(props: SharedProps) {
  return (
    <div className="card sticky top-24 rounded-2xl border border-brand-border bg-white p-6 shadow-card">
      <div className="mb-2 border-b-[3px] border-double border-brand-navy pb-3">
        <h2 className="font-display text-xl font-semibold text-brand-navy">Booking summary</h2>
      </div>
      <SummaryBody {...props} />
    </div>
  );
}

export function SummarySheet({ open, onClose, ...props }: SharedProps & { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Booking summary">
      <button className="absolute inset-0 bg-brand-deep/60" onClick={onClose} aria-label="Close summary" />
      <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8 shadow-lift animate-fade-up">
        <div className="mb-3 flex items-center justify-between border-b-[3px] border-double border-brand-navy pb-3">
          <h2 className="font-display text-xl font-semibold text-brand-navy">Booking summary</h2>
          <button onClick={onClose} aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full border border-brand-border">
            <X className="h-4 w-4" />
          </button>
        </div>
        <SummaryBody {...props} />
      </div>
    </div>
  );
}