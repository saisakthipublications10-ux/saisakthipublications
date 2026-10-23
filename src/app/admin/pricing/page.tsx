import Link from "next/link";
import { Badge, Card, Field, Page, SelectField, Toggle, td, th } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { createRule, saveCoupon, saveTax, toggleCoupon, toggleRule } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { istToday } from "@/lib/admin";
import { fmtMoney } from "@/lib/bookings-read";
import { rupeesStr } from "@/lib/money";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";
const UNIT = { flat: "flat", per_word: "per word", per_cm2: "per cm²" } as const;
type PricingRule = {
  id: string;
  newspaperId: string;
  formatId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  mode: keyof typeof UNIT;
  rateMinor: number;
  minChargeMinor: number;
  colourSurchargeMinor: number;
};

export default async function Pricing({ searchParams }: { searchParams: { paper?: string } }) {
  await requireAdmin("/admin/pricing");
  const today = istToday();

  const [papers, fmts, rulesSnap, coupons, tax] = await Promise.all([
    db.collection("newspapers").orderBy("name").get(),
    db.collection("formats").orderBy("name").get(),
    db.collection("pricingRules").get(),
    db.collection("coupons").get(),
    db.collection("settings").doc("tax").get(),
  ]);
  const pn = Object.fromEntries(papers.docs.map((d) => [d.id, d.data().name as string]));
  const fn = Object.fromEntries(fmts.docs.map((d) => [d.id, d.data().name as string]));

  const rules: PricingRule[] = rulesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PricingRule)
    .filter((r) => !searchParams.paper || r.newspaperId === searchParams.paper)
    .sort((a, b) =>
      (a.newspaperId + a.formatId).localeCompare(b.newspaperId + b.formatId) ||
      a.effectiveFrom.localeCompare(b.effectiveFrom),
    );

  const state = (r: PricingRule) =>
    !r.active ? ["Disabled", "neutral"] as const
    : r.effectiveFrom > today ? ["Scheduled", "blue"] as const
    : r.effectiveTo && r.effectiveTo < today ? ["Ended", "neutral"] as const
    : ["Current", "green"] as const;

  return (
    <Page eyebrow="Commercial" title="Pricing">
      <Card title="Tax">
        <AdminForm action={saveTax} className="flex flex-wrap items-end gap-3">
          <Field label="GST rate (%)" name="gst" defaultValue={rupeesStr(tax.data()?.gstBps ?? 0)} className="w-40" hint="e.g. 18 or 12.5" />
          <SubmitButton>Save tax</SubmitButton>
        </AdminForm>
      </Card>

      <Card title="Add a rate">
        <AdminForm action={createRule} resetOnSuccess className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Newspaper" name="newspaperId" options={papers.docs.map((d) => ({ value: d.id, label: d.data().name }))} placeholder="Choose…" />
          <SelectField label="Format" name="formatId" options={fmts.docs.map((d) => ({ value: d.id, label: d.data().name }))} placeholder="Choose…" />
          <SelectField label="Charged" name="mode" defaultValue="per_word"
            options={[{ value: "per_word", label: "Per word" }, { value: "per_cm2", label: "Per cm²" }, { value: "flat", label: "Flat" }]} />
          <Field label="Rate (₹)" name="rate" prefix="₹" required />
          <Field label="Minimum charge (₹)" name="minCharge" prefix="₹" />
          <Field label="Colour surcharge (₹)" name="colour" prefix="₹" />
          <Field label="Effective from" name="effectiveFrom" type="date" defaultValue={today} required />
          <div className="self-end"><SubmitButton tone="gold">Add rate</SubmitButton></div>
        </AdminForm>
        <p className="mt-3 text-[11px] text-brand-muted">Rates are never edited in place. A new rate ends the previous one the day before it starts, so history stays intact and past bookings keep the price they were quoted.</p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/pricing" className={`rounded-full px-4 py-2 text-sm font-semibold ${!searchParams.paper ? "bg-brand-navy text-white" : "border border-brand-border bg-white"}`}>All</Link>
        {papers.docs.map((d) => (
          <Link key={d.id} href={`/admin/pricing?paper=${d.id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${searchParams.paper === d.id ? "bg-brand-navy text-white" : "border border-brand-border bg-white"}`}>{d.data().name}</Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-brand-border bg-brand-bg">
            <tr><th className={th}>Newspaper / format</th><th className={th}>Rate</th><th className={th}>Min</th><th className={th}>Colour</th><th className={th}>Effective</th><th className={th}>State</th><th className={`${th} text-right`}>On</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rules.map((r) => {
              const [label, tone] = state(r);
              return (
                <tr key={r.id}>
                  <td className={td}><span className="font-semibold text-brand-navy">{pn[r.newspaperId]}</span><p className="text-[11px] text-brand-muted">{fn[r.formatId]}</p></td>
                  <td className={`${td} tabular-nums`}>{fmtMoney(r.rateMinor)} <span className="text-xs text-brand-muted">{UNIT[r.mode as keyof typeof UNIT]}</span></td>
                  <td className={`${td} tabular-nums`}>{r.minChargeMinor ? fmtMoney(r.minChargeMinor) : "—"}</td>
                  <td className={`${td} tabular-nums`}>{r.colourSurchargeMinor ? fmtMoney(r.colourSurchargeMinor) : "—"}</td>
                  <td className={td}>{r.effectiveFrom} → {r.effectiveTo ?? "open"}</td>
                  <td className={td}><Badge tone={tone}>{label}</Badge></td>
                  <td className={`${td} flex justify-end`}><Toggle action={toggleRule} id={r.id} active={!!r.active} /></td>
                </tr>
              );
            })}
            {rules.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-brand-muted">No rates yet. Add one above.</td></tr>}
          </tbody>
        </table>
      </div>

      <Card title="Coupons">
        <AdminForm action={saveCoupon} resetOnSuccess className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Code" name="code" required maxLength={20} placeholder="WELCOME10" />
          <SelectField label="Type" name="type" defaultValue="percent" options={[{ value: "percent", label: "Percent off" }, { value: "flat", label: "Flat ₹ off" }]} />
          <Field label="Value (% or ₹)" name="value" required />
          <Field label="Valid from" name="validFrom" type="date" />
          <Field label="Valid to" name="validTo" type="date" />
          <Field label="Max uses" name="maxUses" type="number" min={1} />
          <div className="sm:col-span-2 lg:col-span-6"><SubmitButton>Create coupon</SubmitButton></div>
        </AdminForm>
        <table className="mt-5 w-full">
          <thead><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Valid</th><th className={th}>Used</th><th className={`${th} text-right`}>On</th></tr></thead>
          <tbody className="divide-y divide-brand-border">
            {coupons.docs.map((d) => {
              const c = d.data();
              return (
                <tr key={d.id}>
                  <td className={`${td} font-semibold text-brand-navy`}>{d.id}</td>
                  <td className={td}>{c.type === "percent" ? `${c.value}%` : fmtMoney(c.value)}</td>
                  <td className={td}>{c.validFrom ?? "any"} → {c.validTo ?? "any"}</td>
                  <td className={td}>{c.used ?? 0}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td className={`${td} flex justify-end`}><Toggle action={toggleCoupon} id={d.id} active={!!c.active} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}