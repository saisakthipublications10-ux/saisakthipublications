import { FileText } from "lucide-react";
import { Draft, FormatKind } from "./types";

export function AdPreview({
  kind, draft, paperName, area,
}: { kind?: FormatKind; draft: Draft; paperName?: string; area: number }) {
  const c = draft.content;
  const headline = c.headline || "Your headline";
  const body = draft.mode === "upload" ? "" : c.body || "Your advertisement text will appear here as you type.";
  const contact = c.contact || "Contact details";
  const uploaded = draft.mode === "upload";

  return (
    <figure aria-label="Advertisement preview">
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow text-brand-muted">Live preview</p>
        {paperName && <p className="text-xs text-brand-muted">{paperName}</p>}
      </div>

      <div className="paper rounded-xl border border-brand-border p-5 shadow-card">
        {uploaded ? (
          <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-brand-blue/40 p-6 text-center">
            <div>
              <FileText className="mx-auto h-8 w-8 text-brand-blue" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-brand-navy">
                {draft.file?.name ?? "Your artwork"}
              </p>
              <p className="mt-1 text-xs text-brand-muted">Printed as supplied. It must meet the newspaper&apos;s specifications.</p>
            </div>
          </div>
        ) : kind === "box" ? (
          <div className="rounded-sm border-2 border-brand-navy p-1">
            <div className="rounded-[2px] border border-brand-navy/60 p-4 text-center">
              <p className="font-display text-lg font-bold leading-tight text-brand-navy">{headline}</p>
              <div className="mx-auto my-2 h-px w-10 bg-brand-gold" />
              <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-brand-text/80">{body}</p>
              <p className="mt-2 text-[11px] font-semibold tracking-wide text-brand-navy">{contact}</p>
            </div>
          </div>
        ) : kind === "display" || kind === "custom" ? (
          <div className="overflow-hidden rounded-sm border border-brand-border bg-white">
            <div className={`px-4 py-5 ${draft.colour ? "bg-brand-navy text-white" : "bg-brand-text text-white"}`}>
              <p className="font-display text-xl font-bold leading-tight">{headline}</p>
            </div>
            <div className="p-4">
              <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed text-brand-text/80">{body}</p>
              <p className="mt-2 text-[12px] font-semibold text-brand-navy">{contact}</p>
              {c.website && <p className="mt-0.5 break-all text-[11px] text-brand-blue">{c.website}</p>}
            </div>
          </div>
        ) : (
          <div className="border-t-2 border-brand-navy pt-3">
            <p className="text-[12px] leading-[1.6] text-brand-text/80">
              <span className="font-bold uppercase text-brand-navy">{headline}. </span>
              <span className="whitespace-pre-wrap break-words">{body}</span>
            </p>
            <p className="mt-2 text-[12px] font-semibold text-brand-navy">{contact}</p>
          </div>
        )}
      </div>

      <figcaption className="mt-2 text-xs leading-relaxed text-brand-muted">
        Indicative layout only. The newspaper sets the final typography
        {area > 0 ? ` and fits your ad to ${draft.widthCm} × ${draft.heightCm} cm.` : "."}
      </figcaption>
    </figure>
  );
}