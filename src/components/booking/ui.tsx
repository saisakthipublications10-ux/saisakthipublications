"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useId } from "react";
import { Check } from "lucide-react";

export function StageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <p className="eyebrow text-brand-blue">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-brand-navy sm:text-3xl">
        {title}
      </h2>
      {text && <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">{text}</p>}
    </div>
  );
}

export function ChoiceCard({
  name, value, checked, onChange, disabled, children,
}: {
  name: string; value: string; checked: boolean; onChange: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <label className={`relative block ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange}
        disabled={disabled} className="peer sr-only" />
      <span className="block h-full rounded-xl border border-brand-border bg-white p-4 transition-all
        hover:border-brand-blue peer-checked:border-brand-navy peer-checked:bg-brand-navy/[0.03]
        peer-checked:shadow-card peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold peer-focus-visible:ring-offset-2">
        {children}
      </span>
      <span aria-hidden className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border
        border-brand-border bg-white text-transparent transition-colors peer-checked:border-brand-navy
        peer-checked:bg-brand-navy peer-checked:text-brand-gold">
        <Check className="h-3 w-3" />
      </span>
    </label>
  );
}

type TFProps = {
  label: string; hint?: string; error?: string; optional?: boolean; multiline?: boolean; rows?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export function TextField({ label, hint, error, optional, multiline, rows = 5, id, className = "", ...rest }: TFProps) {
  const uid = useId();
  const fid = id ?? uid;
  const describedBy = error ? `${fid}-e` : hint ? `${fid}-h` : undefined;
  const cls = `w-full rounded-xl border bg-white px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted/60
    transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20
    ${error ? "border-red-500" : "border-brand-border"} ${className}`;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-brand-navy">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-brand-muted">Optional</span>}
      </label>
      {multiline ? (
        <textarea id={fid} rows={rows} aria-invalid={!!error} aria-describedby={describedBy} className={cls}
          {...(rest as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input id={fid} aria-invalid={!!error} aria-describedby={describedBy} className={cls} {...rest} />
      )}
      {error ? (
        <p id={`${fid}-e`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">{error}</p>
      ) : hint ? (
        <p id={`${fid}-h`} className="mt-1.5 text-xs text-brand-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg p-8 text-center">
      <p className="font-display text-lg font-semibold text-brand-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-muted">{text}</p>
      {children}
    </div>
  );
}

export function Skeletons({ n = 4, className = "h-20" }: { n?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-brand-border/50 ${className}`} aria-hidden />
      ))}
    </>
  );
}