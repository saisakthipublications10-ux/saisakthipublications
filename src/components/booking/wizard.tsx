"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, ReceiptText } from "lucide-react";
import { formatINR } from "../../lib/money";
import {
  Category, DateOpt, Format, Loc, Paper, Quote, QuoteStatus, countWords, normPhone,
} from "./types";
import { contentSchema, customerSchema, issuesToMap, uploadContentSchema } from "./schemas";
import { useDraft } from "./use-draft";
import { useArtwork } from "./use-artwork";
import { Stepper } from "./stepper";
import { SummaryCard, SummarySheet } from "./summary";
import {
  Created, StepAdType, StepContent, StepDate, StepDetails, StepLocation, StepNewspaper, StepReview,
} from "./steps";

const STAGES = ["Location", "Newspaper", "Ad type", "Content", "Date", "Details", "Review"] as const;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const contentType = r.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`The server returned an unexpected response (HTTP ${r.status}).`);
  }

  const payload: unknown = await r.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("The server returned an invalid response.");
  }
  const result = payload as {
    ok?: boolean;
    data?: T;
    error?: { message?: string };
  };
  if (!r.ok || result.ok !== true) {
    throw new Error(result.error?.message ?? `Request failed (HTTP ${r.status}).`);
  }
  return result.data as T;
}

export function BookingWizard({
  initialLocation, preferredFormat, user,
}: {
  initialLocation?: string;
  preferredFormat?: string;
  user: { name: string | null; email: string | null } | null;
}) {
  const { draft, patch, clear, hydrated } = useDraft();
  const art = useArtwork();
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const [stage, setStage] = useState(0);
  const [reached, setReached] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [sheet, setSheet] = useState(false);

  const [locations, setLocations] = useState<Loc[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [dates, setDates] = useState<DateOpt[]>([]);
  const [load, setLoad] = useState({ loc: true, paper: false, cat: false, date: false });
  const [loadError, setLoadError] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [qStatus, setQStatus] = useState<QuoteStatus>("idle");
  const [qError, setQError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState<{ reference: string; totalMinor: number } | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  /* ── derived ── */
  const kind = formats.find((f) => f.id === draft.formatId)?.kind;
  const needsArea = kind === "display" || kind === "custom";
  const words = draft.mode === "text" ? countWords(draft.content.body) : 0;
  const area = draft.widthCm && draft.heightCm ? Math.ceil(draft.widthCm * draft.heightCm) : 0;
  const names = {
    location: locations.find((l) => l.id === draft.locationId)?.name,
    paper: papers.find((p) => p.id === draft.newspaperId)?.name,
    category: categories.find((c) => c.id === draft.categoryId)?.name,
    format: formats.find((f) => f.id === draft.formatId)?.name,
  };

  const contentErrors = useMemo(() => {
    const r = (draft.mode === "upload" ? uploadContentSchema : contentSchema).safeParse(draft.content);
    const e = r.success ? {} : issuesToMap(r.error.issues);
    if (needsArea && !area) e.size = "Enter the ad width and height in cm.";
    if (draft.mode === "upload" && art.state.phase !== "ready") e.file = "Upload your artwork file to continue.";
    return e as Record<string, string>;
  }, [draft.content, draft.mode, needsArea, area, art.state.phase]);

  const detailErrors = useMemo(() => {
    const r = customerSchema.safeParse({ ...draft.customer, phone: normPhone(draft.customer.phone) });
    return r.success ? {} : issuesToMap(r.error.issues);
  }, [draft.customer]);

  const valid = [
    !!draft.locationId,
    !!draft.newspaperId,
    !!draft.categoryId && !!draft.formatId,
    Object.keys(contentErrors).length === 0,
    !!draft.date,
    Object.keys(detailErrors).length === 0,
    draft.acceptTerms,
  ];

  /* ── data loading ── */
  useEffect(() => {
    api<Loc[]>("/api/locations")
      .then(setLocations)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoad((l) => ({ ...l, loc: false })));
  }, []);

  // Apply ?location= once
  const applied = useRef(false);
  useEffect(() => {
    if (!hydrated || applied.current || !locations.length) return;
    applied.current = true;
    if (initialLocation && locations.some((l) => l.id === initialLocation)) {
      if (initialLocation !== draftRef.current.locationId)
        patch({ locationId: initialLocation, newspaperId: "", formatId: "", date: "" });
      setStage(1);
      setReached(1);
    }
  }, [hydrated, locations, initialLocation, patch]);

  useEffect(() => {
    if (!hydrated || !user) return;
    const customer = draftRef.current.customer;
    if (!customer.name && !customer.email) {
      patch({ customer: { ...customer, name: user.name ?? "", email: user.email ?? "" } });
    }
  }, [hydrated, user, patch]);

  useEffect(() => {
    if (!draft.locationId) return setPapers([]);
    setLoad((l) => ({ ...l, paper: true }));
    api<Paper[]>(`/api/newspapers?locationId=${draft.locationId}`)
      .then((list) => {
        setPapers(list);
        const cur = draftRef.current.newspaperId;
        if (cur && !list.some((p) => p.id === cur)) patch({ newspaperId: "", formatId: "", date: "" });
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoad((l) => ({ ...l, paper: false })));
  }, [draft.locationId, patch]);

  useEffect(() => {
    if (!draft.newspaperId) { setFormats([]); setCategories([]); setDates([]); return; }
    setLoad((l) => ({ ...l, cat: true, date: true }));
    api<{ categories: Category[]; formats: Format[] }>(`/api/catalog?newspaperId=${draft.newspaperId}`)
      .then((c) => {
        setCategories(c.categories);
        setFormats(c.formats);
        const d = draftRef.current;
        if (d.formatId && !c.formats.some((f) => f.id === d.formatId)) patch({ formatId: "", date: "" });
        else if (!d.formatId && preferredFormat && c.formats.some((f) => f.id === preferredFormat))
          patch({ formatId: preferredFormat });
        if (d.categoryId && !c.categories.some((x) => x.id === d.categoryId)) patch({ categoryId: "" });
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoad((l) => ({ ...l, cat: false })));
    api<DateOpt[]>(`/api/dates?newspaperId=${draft.newspaperId}`)
      .then((opts) => {
        setDates(opts);
        const cur = draftRef.current.date;
        if (cur && !opts.some((o) => o.date === cur && o.available)) patch({ date: "" });
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoad((l) => ({ ...l, date: false })));
  }, [draft.newspaperId, preferredFormat, patch]);

  /* ── live quote (debounced) ── */
  useEffect(() => {
    const ready = draft.newspaperId && draft.formatId && draft.date &&
      (words > 0 || area > 0 || draft.mode === "upload");
    if (!ready) { setQuote(null); setQStatus("idle"); return; }
    const ctrl = new AbortController();
    setQStatus("loading");
    const t = setTimeout(async () => {
      try {
        const q = await api<Quote>("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            newspaperId: draft.newspaperId, formatId: draft.formatId, date: draft.date,
            wordCount: words > 0 ? words : undefined,
            areaCm2: area > 0 ? area : undefined,
            colour: draft.colour || undefined,
            couponCode: draft.couponCode || undefined,
          }),
        });
        setQuote(q); setQStatus("ok"); setQError("");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setQuote(null); setQStatus("error"); setQError((e as Error).message);
      }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [draft.newspaperId, draft.formatId, draft.date, draft.colour, draft.couponCode, draft.mode, words, area]);

  /* ── navigation ── */
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  const goTo = useCallback((i: number) => { setShowErrors(false); setStage(i); }, []);
  const next = () => {
    if (!valid[stage]) return setShowErrors(true);
    setShowErrors(false);
    const n = Math.min(stage + 1, STAGES.length - 1);
    setStage(n);
    setReached((r) => Math.max(r, n));
  };

  const selectLocation = (id: string) =>
    id !== draft.locationId && patch({ locationId: id, newspaperId: "", formatId: "", date: "" });
  const selectPaper = (id: string) =>
    id !== draft.newspaperId && patch({ newspaperId: id, formatId: "", date: "" });

  /* ── submit ── */
  async function submit() {
    if (!valid[6]) return setShowErrors(true);
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const d = draft;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: d.key,
          artworkUploadId: d.mode === "upload" ? art.state.uploadId : undefined,
          locationId: d.locationId, newspaperId: d.newspaperId,
          categoryId: d.categoryId, formatId: d.formatId, date: d.date,
          content: {
            headline: d.content.headline || undefined,
            body: d.mode === "upload" ? "" : d.content.body,
            contact: d.content.contact,
            website: d.content.website || undefined,
            notes: d.content.notes || undefined,
          },
          quote: {
            wordCount: words > 0 ? words : undefined,
            areaCm2: area > 0 ? area : undefined,
            colour: d.colour || undefined,
            couponCode: d.couponCode || undefined,
          },
          customer: {
            name: d.customer.name.trim(), email: d.customer.email.trim(),
            phone: normPhone(d.customer.phone), gstin: d.customer.gstin || undefined,
          },
          acceptTerms: true,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`The server returned an unexpected response (HTTP ${res.status}).`);
      }
      const j: unknown = await res.json();
      if (!j || typeof j !== "object") {
        throw new Error("The server returned an invalid response.");
      }
      const result = j as {
        ok?: boolean;
        data?: { reference: string; totalMinor?: number };
        error?: { message?: string };
      };
      if (res.status === 409) {
        setSubmitError(`${result.error?.message ?? "The selected date is unavailable."} Please choose another date.`);
        patch({ date: "" });
        goTo(4);
        return;
      }
      if (!res.ok || result.ok !== true || !result.data) {
        throw new Error(result.error?.message ?? `Could not create booking (HTTP ${res.status}).`);
      }
      setCreated({
        reference: result.data.reference,
        totalMinor: result.data.totalMinor ?? quote?.totalMinor ?? 0,
      });
      clear();
    } catch (e) {
      setSubmitError((e as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const summaryProps = { draft, names, words, area, quote, status: qStatus, error: qError };

  if (created)
    return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Created {...created} /></div>;

  const last = stage === STAGES.length - 1;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-0">
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-card sm:px-8 sm:py-6">
        <Stepper stages={STAGES} current={stage} reached={reached} onJump={goTo} />
      </div>

      {loadError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {loadError}{" "}
          <button className="underline" onClick={() => location.reload()}>Retry</button>
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-brand-border bg-white shadow-card">
          <div ref={panel} tabIndex={-1} key={stage} className="animate-fade-up p-5 outline-none sm:p-8">
            {stage === 0 && (
              <StepLocation locations={locations} loading={load.loc} value={draft.locationId} onSelect={selectLocation} />
            )}
            {stage === 1 && (
              <StepNewspaper papers={papers} loading={load.paper} value={draft.newspaperId}
                locationName={names.location} onSelect={selectPaper} onBack={() => goTo(0)} />
            )}
            {stage === 2 && (
              <StepAdType categories={categories} formats={formats} loading={load.cat} draft={draft} patch={patch} />
            )}
            {stage === 3 && (
              <StepContent draft={draft} patch={patch} kind={kind} paperName={names.paper} area={area}
                errors={contentErrors} showErrors={showErrors} signedIn={!!user} art={art.state}
                onFile={art.start} onRemoveFile={art.reset} />
            )}
            {stage === 4 && <StepDate options={dates} loading={load.date} draft={draft} patch={patch} />}
            {stage === 5 && (
              <StepDetails draft={draft} patch={patch} errors={detailErrors} showErrors={showErrors}
                quoteStatus={qStatus} quoteError={qError} discount={quote?.discountMinor ?? 0} />
            )}
            {stage === 6 && (
              <StepReview draft={draft} names={names} kind={kind} words={words} area={area} quote={quote}
                showErrors={showErrors} onEdit={goTo} patch={patch} submitError={submitError} />
            )}

            {showErrors && !valid[stage] && stage !== 6 && (
              <p role="alert" className="mt-6 text-sm font-medium text-red-700">
                Please complete this step to continue.
              </p>
            )}

            {/* Desktop navigation */}
            <div className="mt-10 hidden items-center justify-between border-t border-brand-border pt-6 lg:flex">
              <button type="button" onClick={() => goTo(stage - 1)} disabled={stage === 0}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-border px-6 text-sm font-semibold text-brand-navy hover:bg-brand-bg disabled:invisible">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Back
              </button>
              <PrimaryAction last={last} submitting={submitting} onNext={next} onSubmit={submit} />
            </div>
          </div>
        </section>

        <aside className="hidden lg:block" aria-label="Booking summary">
          <SummaryCard {...summaryProps} />
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <button type="button" onClick={() => goTo(stage - 1)} disabled={stage === 0} aria-label="Back"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-border disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setSheet(true)}
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-border px-3 text-sm font-semibold text-brand-navy">
            <ReceiptText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate tabular-nums">
              {qStatus === "ok" && quote ? formatINR(quote.totalMinor) : "Summary"}
            </span>
          </button>
          <PrimaryAction last={last} submitting={submitting} onNext={next} onSubmit={submit} compact />
        </div>
      </div>
      <SummarySheet open={sheet} onClose={() => setSheet(false)} {...summaryProps} />
    </div>
  );
}

function PrimaryAction({
  last, submitting, onNext, onSubmit, compact,
}: { last: boolean; submitting: boolean; onNext: () => void; onSubmit: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={last ? onSubmit : onNext} disabled={submitting}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-6 text-sm font-bold text-brand-navy shadow-sm transition-all hover:brightness-95 active:scale-[.98] disabled:opacity-60 ${compact ? "shrink-0" : "px-8"}`}>
      {submitting ? (
        <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Confirming…</>
      ) : last ? (
        <><Lock className="h-4 w-4" aria-hidden /> Confirm booking</>
      ) : (
        <>Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></>
      )}
    </button>
  );
}