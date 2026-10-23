import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Page({ eyebrow, title, actions, children }: {
  eyebrow: string; title: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-double border-brand-navy pb-5">
        <div>
          <p className="eyebrow text-brand-blue">{eyebrow}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">{title}</h1>
        </div>
        {actions}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function Card({ title, aside, children, className = "" }: {
  title?: string; aside?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-brand-border bg-white shadow-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-brand-navy">{title}</h2>
          {aside}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, icon: Icon, href }: {
  label: string; value: string | number; icon: LucideIcon; href?: string;
}) {
  const body = (
    <div className={`rounded-2xl border border-brand-border bg-white p-5 shadow-card ${href ? "transition-all hover:-translate-y-0.5 hover:border-brand-navy" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="eyebrow text-brand-muted">{label}</p>
        <Icon className="h-4 w-4 text-brand-blue" aria-hidden />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-brand-navy sm:text-4xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export const inputCls =
  "w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/60 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

export function Field(p: {
  label: string; name: string; type?: string; defaultValue?: string | number | null; hint?: string;
  placeholder?: string; required?: boolean; min?: number; max?: number; step?: string; maxLength?: number;
  prefix?: string; className?: string;
}) {
  return (
    <div className={p.className}>
      <label htmlFor={`f-${p.name}`} className="mb-1.5 block text-xs font-semibold text-brand-navy">{p.label}</label>
      <div className="relative">
        {p.prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-muted">{p.prefix}</span>}
        <input id={`f-${p.name}`} name={p.name} type={p.type ?? "text"} defaultValue={p.defaultValue ?? ""}
          placeholder={p.placeholder} required={p.required} min={p.min} max={p.max} step={p.step} maxLength={p.maxLength}
          className={`${inputCls} ${p.prefix ? "pl-8" : ""}`} />
      </div>
      {p.hint && <p className="mt-1 text-[11px] text-brand-muted">{p.hint}</p>}
    </div>
  );
}

export function SelectField({ label, name, options, defaultValue, placeholder, className }: {
  label: string; name: string; options: { value: string; label: string }[];
  defaultValue?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-xs font-semibold text-brand-navy">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue ?? ""} className={inputCls}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function CheckField({ label, name, value, defaultChecked, hint }: {
  label: string; name: string; value?: string; defaultChecked?: boolean; hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border bg-white px-3.5 py-3 hover:border-brand-blue">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 shrink-0 accent-[#102C46]" />
      <span>
        <span className="block text-sm font-medium text-brand-navy">{label}</span>
        {hint && <span className="block text-[11px] text-brand-muted">{hint}</span>}
      </span>
    </label>
  );
}

const TONES = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  gold: "bg-brand-goldsoft text-brand-navy ring-brand-gold/60",
  blue: "bg-sky-50 text-brand-blue ring-sky-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  red: "bg-red-50 text-red-800 ring-red-200",
};
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
}

/** Enable/disable switch. `action` is a server action taking FormData(id, next). */
export function Toggle({ action, id, active }: { action: (fd: FormData) => Promise<void>; id: string; active: boolean }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={String(!active)} />
      <button type="submit" role="switch" aria-checked={active} aria-label={active ? "Disable" : "Enable"}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active ? "bg-brand-navy" : "bg-brand-border"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </form>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-brand-muted";
export const td = "px-4 py-3 text-sm";