"use client";
import { useState } from "react";
import {
  MapPin, Newspaper, AlignLeft, Square, LayoutTemplate, Ruler, Upload, PencilLine,
  Clock, Pencil, Tag, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  Category, DateOpt, Draft, Format, FormatKind, Loc, Paper, Quote, QuoteStatus, countWords, fmtDate,
} from "./types";
import { ChoiceCard, EmptyState, Skeletons, StageHeading, TextField } from "./ui";
import { DateCalendar } from "./calendar";
import { AdPreview } from "./ad-preview";
import type { Names } from "./summary";
import { ArtworkDropzone } from "./artwork-dropzone";
import type { ArtState } from "./use-artwork";

type Patch = (p: Partial<Draft>) => void;
const formatINR = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

/* ───────── 1. Location ───────── */
export function StepLocation(p: { locations: Loc[]; loading: boolean; value: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <StageHeading eyebrow="Step 1" title="Where do you want to advertise?"
        text="Choose the neighbourhood you want your advertisement to reach." />
      <fieldset className="mt-8">
        <legend className="sr-only">Neighbourhood</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.loading ? <Skeletons n={5} /> : p.locations.map((l) => (
            <ChoiceCard key={l.id} name="location" value={l.id} checked={p.value === l.id} onChange={() => p.onSelect(l.id)}>
              <span className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-bg text-brand-blue">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-xl font-medium text-brand-navy">{l.name}</span>
              </span>
            </ChoiceCard>
          ))}
        </div>
        {!p.loading && p.locations.length === 0 && (
          <EmptyState title="No locations available" text="Locations haven't been enabled yet. Please check back soon." />
        )}
      </fieldset>
    </div>
  );
}

/* ───────── 2. Newspaper ───────── */
export function StepNewspaper(p: {
  papers: Paper[]; loading: boolean; value: string; locationName?: string; onSelect: (id: string) => void; onBack: () => void;
}) {
  return (
    <div>
      <StageHeading eyebrow="Step 2" title={`Newspapers serving ${p.locationName ?? "your area"}`}
        text="Only newspapers the administrator has mapped to this neighbourhood are shown." />
      <fieldset className="mt-8">
        <legend className="sr-only">Newspaper</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {p.loading ? <Skeletons n={2} className="h-36" /> : p.papers.map((n) => (
            <ChoiceCard key={n.id} name="paper" value={n.id} checked={p.value === n.id} onChange={() => p.onSelect(n.id)}>
              <span className="block border-y-[3px] border-double border-brand-navy py-5 text-center">
                <Newspaper className="mx-auto h-5 w-5 text-brand-gold" aria-hidden />
                <span className="mt-2 block font-display text-2xl font-semibold leading-none tracking-tight text-brand-navy">
                  {n.name}
                </span>
              </span>
            </ChoiceCard>
          ))}
        </div>
        {!p.loading && p.papers.length === 0 && (
          <EmptyState title="No newspapers available here yet"
            text="There are no newspapers currently configured for this neighbourhood. Try another location.">
            <button type="button" onClick={p.onBack}
              className="mt-4 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-bg">
              Choose a different location
            </button>
          </EmptyState>
        )}
      </fieldset>
    </div>
  );
}

/* ───────── 3. Ad type ───────── */
const KIND_META: Record<FormatKind, { icon: typeof AlignLeft; text: string }> = {
  text: { icon: AlignLeft, text: "Typed text only. Quick and simple." },
  box: { icon: Square, text: "A bordered block that stands out on the page." },
  display: { icon: LayoutTemplate, text: "Headline, artwork and colour options." },
  custom: { icon: Ruler, text: "Your own dimensions and layout." },
};

export function StepAdType(p: {
  categories: Category[]; formats: Format[]; loading: boolean; draft: Draft; patch: Patch;
}) {
  return (
    <div>
      <StageHeading eyebrow="Step 3" title="What kind of advertisement?"
        text="Categories and formats shown are the ones this newspaper currently offers." />

      {p.loading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2"><Skeletons n={4} /></div>
      ) : (
        <>
          <fieldset className="mt-8">
            <legend className="mb-3 text-sm font-semibold text-brand-navy">Category</legend>
            {p.categories.length === 0 ? (
              <EmptyState title="No categories enabled" text="No advertisement categories are enabled right now." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.categories.map((c) => (
                  <label key={c.id} className="relative">
                    <input type="radio" name="category" value={c.id} className="peer sr-only"
                      checked={p.draft.categoryId === c.id} onChange={() => p.patch({ categoryId: c.id })} />
                    <span className="block cursor-pointer rounded-full border border-brand-border bg-white px-4 py-2.5 text-sm font-medium
                      transition-all hover:border-brand-blue peer-checked:border-brand-navy peer-checked:bg-brand-navy
                      peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold peer-focus-visible:ring-offset-2">
                      {c.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="mt-8">
            <legend className="mb-3 text-sm font-semibold text-brand-navy">Format</legend>
            {p.formats.length === 0 ? (
              <EmptyState title="No formats available" text="This newspaper has no advertisement formats enabled yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {p.formats.map((f) => {
                  const M = KIND_META[f.kind];
                  return (
                    <ChoiceCard key={f.id} name="format" value={f.id} checked={p.draft.formatId === f.id}
                      onChange={() => p.patch({ formatId: f.id, date: "" })}>
                      <M.icon className="h-6 w-6 text-brand-blue" aria-hidden />
                      <span className="mt-3 block text-base font-bold text-brand-navy">{f.name}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-brand-muted">{M.text}</span>
                    </ChoiceCard>
                  );
                })}
              </div>
            )}
          </fieldset>
        </>
      )}
    </div>
  );
}

/* ───────── 4. Content ───────── */
export function StepContent(p: {
  draft: Draft; patch: Patch; kind?: FormatKind; paperName?: string; area: number;
  errors: Record<string, string>; showErrors: boolean; signedIn: boolean;
  art: ArtState; onFile: (f: File) => void; onRemoveFile: () => void;
}) {
  const { draft, patch, kind, errors: e, showErrors } = p;
  const c = draft.content;
  const set = (k: keyof Draft["content"]) => (ev: React.ChangeEvent<HTMLInputElement>) =>
    patch({ content: { ...c, [k]: ev.target.value } });
  const err = (k: string) => (showErrors ? e[k] : undefined);
  const words = countWords(c.body);
  const needsArea = kind === "display" || kind === "custom";
  const canUpload = kind !== "text";

  return (
    <div>
      <StageHeading eyebrow="Step 4" title="Write your advertisement"
        text="Everything here is checked again by the newspaper before publication." />

      <div role="tablist" aria-label="How to add your content"
        className="mt-8 inline-flex rounded-xl border border-brand-border bg-brand-bg p-1">
        {([
          ["text", "Type it online", PencilLine],
          ["upload", "Upload artwork", Upload],
        ] as const).map(([m, label, Icon]) => {
          const disabled = m === "upload" && !canUpload;
          return (
            <button key={m} role="tab" type="button" aria-selected={draft.mode === m} disabled={disabled}
              onClick={() => patch({ mode: m })}
              className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all
                ${draft.mode === m ? "bg-white text-brand-navy shadow-card" : "text-brand-muted hover:text-brand-navy"}
                disabled:cursor-not-allowed disabled:opacity-50`}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          );
        })}
      </div>
      {kind === "text" && (
        <p className="mt-2 text-xs text-brand-muted">Text-only classifieds are typed online.</p>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          {draft.mode === "text" ? (
            <>
              <TextField label="Headline" optional placeholder="e.g. 2 BHK flat for rent" value={c.headline}
                onChange={set("headline")} error={err("headline")} maxLength={120} />
              <div>
                <TextField label="Advertisement text" multiline rows={6} value={c.body}
                  placeholder="Write exactly what should be printed."
                  onChange={set("body")} error={err("body")} />
                <p className="mt-1.5 text-right text-xs tabular-nums text-brand-muted" aria-live="polite">
                  {words} {words === 1 ? "word" : "words"}
                </p>
              </div>
            </>
          ) : (
            <div>
              <ArtworkDropzone signedIn={p.signedIn} art={p.art} onPick={p.onFile} onRemove={p.onRemoveFile} />
              {err("file") && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{err("file")}</p>}
            </div>
          )}

          {needsArea && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-brand-navy">Ad size</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["widthCm", "heightCm"] as const).map((k) => (
                  <TextField key={k} label={k === "widthCm" ? "Width (cm)" : "Height (cm)"} type="number"
                    inputMode="decimal" min={1} step="0.5" value={draft[k] ?? ""}
                    onChange={(ev) => patch({ [k]: ev.target.value ? Number(ev.target.value) : null, date: "" })} />
                ))}
              </div>
              {p.area > 0 ? (
                <p className="mt-1.5 text-xs text-brand-muted">Billable area: {p.area} cm²</p>
              ) : showErrors && e.size ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{e.size}</p>
              ) : null}
            </fieldset>
          )}

          {kind && kind !== "text" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-white p-4">
              <input type="checkbox" checked={draft.colour} onChange={(ev) => patch({ colour: ev.target.checked })}
                className="h-5 w-5 accent-[#102C46]" />
              <span>
                <span className="block text-sm font-semibold text-brand-navy">Print in colour</span>
                <span className="block text-xs text-brand-muted">If the newspaper charges extra, it appears in your price.</span>
              </span>
            </label>
          )}

          <TextField label="Contact details to publish" placeholder="Phone number and/or address as it should print"
            value={c.contact} onChange={set("contact")} error={err("contact")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Website" optional type="url" placeholder="https://" value={c.website}
              onChange={set("website")} error={err("website")} />
            <TextField label="Notes for the newspaper" optional value={c.notes} onChange={set("notes")} />
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <AdPreview kind={kind} draft={draft} paperName={p.paperName} area={p.area} />
        </div>
      </div>
    </div>
  );
}

/* ───────── 5. Date ───────── */
export function StepDate(p: { options: DateOpt[]; loading: boolean; draft: Draft; patch: Patch }) {
  const sel = p.options.find((o) => o.date === p.draft.date);
  return (
    <div>
      <StageHeading eyebrow="Step 5" title="Choose a publication date"
        text="Only dates that are open right now are selectable. Availability is checked again when you confirm." />
      <div className="mt-8">
        {p.loading ? <Skeletons n={1} className="h-96" /> : (
          <DateCalendar options={p.options} value={p.draft.date} onChange={(d) => p.patch({ date: d })} />
        )}
      </div>
      {sel && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-goldsoft p-4" aria-live="polite">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" aria-hidden />
          <p className="text-sm leading-relaxed text-brand-navy">
            <strong>{fmtDate(sel.date)}.</strong> Bookings for this date close on{" "}
            {new Date(sel.cutoffAt).toLocaleString("en-IN", {
              weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
            })}. Publication is confirmed only after review.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────── 6. Details ───────── */
export function StepDetails(p: {
  draft: Draft; patch: Patch; errors: Record<string, string>; showErrors: boolean;
  quoteStatus: QuoteStatus; quoteError: string; discount: number;
}) {
  const { draft, patch, errors: e, showErrors } = p;
  const cu = draft.customer;
  const set = (k: keyof Draft["customer"]) => (ev: React.ChangeEvent<HTMLInputElement>) =>
    patch({ customer: { ...cu, [k]: ev.target.value } });
  const err = (k: string) => (showErrors ? e[k] : undefined);
  const [coupon, setCoupon] = useState(draft.couponCode);

  return (
    <div>
      <StageHeading eyebrow="Step 6" title="Your details"
        text="We use these to send your booking confirmation and updates." />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField label="Full name" autoComplete="name" value={cu.name} onChange={set("name")} error={err("name")} />
        </div>
        <TextField label="Email address" type="email" autoComplete="email" value={cu.email}
          onChange={set("email")} error={err("email")} />
        <TextField label="Mobile number" type="tel" autoComplete="tel" placeholder="+91 98765 43210"
          value={cu.phone} onChange={set("phone")} error={err("phone")} hint="Include the country code." />
        <div className="sm:col-span-2">
          <TextField label="GSTIN" optional value={cu.gstin} maxLength={15}
            onChange={(ev) => patch({ customer: { ...cu, gstin: ev.target.value.toUpperCase() } })}
            error={err("gstin")} hint="Only if you need a GST invoice." />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-brand-border bg-brand-bg p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
          <Tag className="h-4 w-4 text-brand-blue" aria-hidden /> Coupon code
          <span className="text-xs font-medium text-brand-muted">Optional</span>
        </p>
        <div className="mt-3 flex gap-2">
          <input aria-label="Coupon code" value={coupon} onChange={(ev) => setCoupon(ev.target.value.toUpperCase())}
            className="min-h-11 flex-1 rounded-xl border border-brand-border bg-white px-4 text-sm uppercase tracking-wider focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
          <button type="button" onClick={() => patch({ couponCode: coupon.trim() })}
            className="min-h-11 rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white hover:bg-brand-blue">
            Apply
          </button>
        </div>
        <p className="mt-2 text-xs" aria-live="polite">
          {draft.couponCode && p.quoteStatus === "error" && <span className="font-medium text-red-700">{p.quoteError}</span>}
          {draft.couponCode && p.quoteStatus === "ok" && p.discount > 0 && (
            <span className="font-medium text-emerald-700">Coupon applied: −{formatINR(p.discount)}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ───────── 7. Review ───────── */
export function StepReview(p: {
  draft: Draft; names: Names; kind?: FormatKind; words: number; area: number; quote: Quote | null;
  showErrors: boolean; onEdit: (stage: number) => void; patch: Patch; submitError: string;
}) {
  const { draft, names } = p;
  const rows: [string, string, number][] = [
    ["Location", names.location ?? "", 0],
    ["Newspaper", names.paper ?? "", 1],
    ["Format", `${names.format ?? ""} · ${names.category ?? ""}`, 2],
    ["Size", p.area > 0 ? `${draft.widthCm} × ${draft.heightCm} cm (${p.area} cm²)` : draft.mode === "text" ? `${p.words} words` : "Uploaded artwork", 3],
    ["Publication date", fmtDate(draft.date), 4],
    ["Customer", `${draft.customer.name} · ${draft.customer.email}`, 5],
  ];
  return (
    <div>
      <StageHeading eyebrow="Step 7" title="Review and confirm"
        text="Check everything below. You can edit any section before confirming." />

      {p.submitError && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {p.submitError}
        </p>
      )}

      <dl className="mt-8 divide-y divide-brand-border border-y-2 border-brand-navy">
        {rows.map(([k, v, s]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wider text-brand-muted">{k}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-brand-navy">{v}</dd>
            </div>
            <button type="button" onClick={() => p.onEdit(s)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-brand-blue hover:bg-brand-bg">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </button>
          </div>
        ))}
      </dl>

      <div className="mt-6 max-w-lg">
        <AdPreview kind={p.kind} draft={draft} paperName={names.paper} area={p.area} />
      </div>

      <label className={`mt-8 flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
        p.showErrors && !draft.acceptTerms ? "border-red-500 bg-red-50/40" : "border-brand-border bg-white"}`}>
        <input type="checkbox" checked={draft.acceptTerms} onChange={(ev) => p.patch({ acceptTerms: ev.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#102C46]" />
        <span className="text-sm leading-relaxed text-brand-text">
          I have read and accept the{" "}
          <Link href="/terms" target="_blank" className="font-semibold text-brand-blue underline">Terms of Service</Link> and the{" "}
          <Link href="/refunds" target="_blank" className="font-semibold text-brand-blue underline">Cancellation &amp; Refund Policy</Link>.
          I understand publication is confirmed only after review and newspaper confirmation.
        </span>
      </label>
      {p.showErrors && !draft.acceptTerms && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">Please accept the terms to continue.</p>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-brand-muted">
        <ShieldCheck className="h-4 w-4 text-brand-blue" aria-hidden />
        Prices and dates are re-verified on our server when you confirm.
      </p>
    </div>
  );
}

/* ───────── Post-submit panel ───────── */
export function Created(p: { reference: string; totalMinor: number }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-brand-border bg-white p-8 text-center shadow-lift sm:p-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-gold text-brand-navy">
        <Newspaper className="h-6 w-6" aria-hidden />
      </div>
      <p className="eyebrow mt-6 text-brand-blue">Booking created</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-brand-navy">Reference {p.reference}</h2>
      <p className="mt-4 text-sm leading-relaxed text-brand-muted">
        Your booking is saved with status <strong className="text-brand-navy">Pending Payment</strong> for{" "}
        <strong className="text-brand-navy">{formatINR(p.totalMinor)}</strong>. Your date is not yet confirmed.
      </p>
      {/* PHASE 3: replace with Razorpay checkout; confirm via signed webhook, never client success. */}
      <p className="mt-6 rounded-xl bg-brand-goldsoft p-4 text-sm font-medium text-brand-navy">
        Online payment is not enabled yet. Please keep your reference number.
      </p>
    </div>
  );
}