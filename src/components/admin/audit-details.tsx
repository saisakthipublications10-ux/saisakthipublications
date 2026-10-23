import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "./ui";
import { STATUS } from "@/lib/booking-status";
import { fmtMoney } from "@/lib/bookings-read";

export interface Names {
  locations: Record<string, string>;
  formats: Record<string, string>;
  newspapers: Record<string, string>;
  categories: Record<string, string>;
}

type Meta = Record<string, unknown>;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ACTION: Record<string, string> = {
  "newspaper.create": "Newspaper created",
  "newspaper.update": "Newspaper settings saved",
  "newspapers.enable": "Newspaper switched on",
  "newspapers.disable": "Newspaper switched off",
  "location.create": "Location added",
  "location.update": "Location updated",
  "locations.enable": "Location switched on",
  "locations.disable": "Location switched off",
  "category.create": "Category added",
  "categories.enable": "Category switched on",
  "categories.disable": "Category switched off",
  "format.create": "Format added",
  "formats.enable": "Format switched on",
  "formats.disable": "Format switched off",
  "availability.update": "Date availability changed",
  "pricing.create": "Rate added",
  "pricingRules.enable": "Rate switched on",
  "pricingRules.disable": "Rate switched off",
  "tax.update": "Tax rate changed",
  "coupon.create": "Coupon created",
  "coupons.enable": "Coupon switched on",
  "coupons.disable": "Coupon switched off",
  "booking.status": "Booking status changed",
  "bookings.export": "Bookings exported to CSV",
  "support.resolve": "Support message resolved",
};

export const actionLabel = (a: string) =>
  ACTION[a] ?? a.replace(/[._]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

function dayNames(v: unknown) {
  const d = Array.from(new Set(arr(v).map(Number))).filter((n) => n >= 0 && n <= 6).sort();
  if (d.length === 7) return ["Every day"];
  return d.map((n) => DAYS[n]);
}

function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
      {items.length === 0 ? (
        <span className="text-xs text-brand-muted">None</span>
      ) : (
        items.map((i) => (
          <span key={i} className="rounded-full bg-brand-bg px-2.5 py-0.5 text-[11px] font-medium text-brand-navy ring-1 ring-inset ring-brand-border">
            {i}
          </span>
        ))
      )}
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
      <span className="text-brand-text">{children}</span>
    </div>
  );
}

const MODE: Record<string, string> = { flat: "flat", per_word: "per word", per_cm2: "per cm²" };

/** Friendly name + link for the "target" path, e.g. newspapers/omr-voice */
export function Target({ target, names }: { target: string; names: Names }) {
  const [col, id = "", ...rest] = target.split("/");
  const link = (label: string, href?: string) =>
    href ? <Link href={href} className="font-medium text-brand-blue hover:underline">{label}</Link> : <span>{label}</span>;

  switch (col) {
    case "newspapers": return link(names.newspapers[id] ?? id, `/admin/newspapers/${id}`);
    case "locations": return link(names.locations[id] ?? id, "/admin/locations");
    case "categories": return link(names.categories[id] ?? id, "/admin/catalog");
    case "formats": return link(names.formats[id] ?? id, "/admin/catalog");
    case "bookings":
      return id && id !== "export" ? link(`Booking …${id.slice(-6)}`, `/admin/bookings/${id}`) : <span>All bookings</span>;
    case "coupons": return link(id, "/admin/pricing");
    case "pricingRules": return link("Pricing rule", "/admin/pricing");
    case "dateAvailability": {
      const date = id.slice(-10);
      const paper = id.slice(0, -11);
      return link(`${names.newspapers[paper] ?? paper} · ${date}`, `/admin/availability?paper=${paper}`);
    }
    case "settings": return <span>{id === "tax" ? "Tax settings" : id}</span>;
    case "supportMessages": return link("Support message", "/admin/support");
    default: return <span className="break-all">{[col, id, ...rest].filter(Boolean).join("/")}</span>;
  }
}

export function AuditDetails({ action, meta, names }: { action: string; meta: Meta; names: Names }) {
  const m = meta ?? {};
  const keys = Object.keys(m);
  if (keys.length === 0) return <span className="text-xs text-brand-muted">—</span>;

  switch (action) {
    case "newspaper.update":
      return (
        <div className="space-y-1.5">
          <Line label="Status"><Badge tone={m.active ? "green" : "neutral"}>{m.active ? "Live" : "Disabled"}</Badge></Line>
          <Chips label="Locations" items={arr(m.locations).map((id) => names.locations[id] ?? id)} />
          <Chips label="Formats" items={arr(m.formatIds).map((id) => names.formats[id] ?? id)} />
          <Chips label="Publishes" items={dayNames(m.weekdays)} />
        </div>
      );

    case "availability.update":
      return (
        <div className="space-y-1.5">
          <Line label="Capacity">{m.capacity == null ? "Unlimited" : String(m.capacity)}</Line>
          <Line label="Date"><Badge tone={m.closed ? "red" : "green"}>{m.closed ? "Closed" : "Open"}</Badge></Line>
          <Line label="Surcharge">{Number(m.surchargeMinor) > 0 ? fmtMoney(Number(m.surchargeMinor)) : "None"}</Line>
        </div>
      );

    case "pricing.create":
      return (
        <div className="space-y-1.5">
          <Line label="For">{names.newspapers[String(m.newspaperId)] ?? String(m.newspaperId)} · {names.formats[String(m.formatId)] ?? String(m.formatId)}</Line>
          <Line label="Rate">{fmtMoney(Number(m.rateMinor))} {MODE[String(m.mode)] ?? ""}</Line>
          <Line label="From">{String(m.effectiveFrom)}</Line>
        </div>
      );

    case "tax.update":
      return <Line label="GST rate">{Number(m.gstBps) / 100}%</Line>;

    case "coupon.create":
      return <Line label="Discount">{m.type === "percent" ? `${m.value}% off` : `${fmtMoney(Number(m.value))} off`}</Line>;

    case "booking.status": {
      const f = m.from as keyof typeof STATUS | undefined;
      const t = m.to as keyof typeof STATUS;
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Badge>{f ? STATUS[f]?.label ?? f : "New"}</Badge>
          <span aria-hidden className="text-brand-muted">→</span>
          <span className="sr-only">to</span>
          <Badge tone={STATUS[t]?.tone}>{STATUS[t]?.label ?? t}</Badge>
        </div>
      );
    }

    case "bookings.export": {
      const filters = Object.entries((m.filters as Record<string, string>) ?? {}).filter(([, v]) => v);
      return (
        <div className="space-y-1.5">
          <Line label="Rows">{String(m.rows)}</Line>
          {filters.length > 0 && <Chips label="Filters" items={filters.map(([k, v]) => `${k}: ${v}`)} />}
        </div>
      );
    }

    default:
      // Generic fallback: readable "key: value" pills instead of JSON
      return (
        <div className="flex flex-wrap gap-1.5">
          {keys.map((k) => {
            const v = m[k];
            const text =
              k.endsWith("Minor") && typeof v === "number" ? fmtMoney(v)
              : Array.isArray(v) ? v.join(", ")
              : typeof v === "boolean" ? (v ? "Yes" : "No")
              : v == null ? "—" : String(v);
            const label = k.replace(/Minor$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
            return (
              <span key={k} className="rounded-full bg-brand-bg px-2.5 py-0.5 text-[11px] text-brand-navy ring-1 ring-inset ring-brand-border">
                <span className="text-brand-muted">{label}:</span> {text}
              </span>
            );
          })}
        </div>
      );
  }
}