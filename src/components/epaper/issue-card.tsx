import { BookOpen, Download } from "lucide-react";
import { EpaperCover } from "./cover";
import { fmtSize, longDate, shortDate } from "@/lib/epaper-shared";
import type { EpaperView } from "@/lib/epaper";

export function IssueCard({ issue, paper }: { issue: EpaperView; paper: string }) {
  const label = longDate(issue.issueDate);
  const meta = `${fmtSize(issue.size)} PDF`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card transition-all hover:-translate-y-1 hover:border-brand-navy hover:shadow-lift">
      <a href={`/api/epaper/${issue.id}/download?view=1`} target="_blank" rel="noopener"
        aria-label={`Read ${paper}, ${label}, online`} className="block aspect-[3/4] overflow-hidden bg-brand-bg">
        <EpaperCover id={issue.id} hasCover={issue.hasCover} paper={paper} date={shortDate(issue.issueDate)} />
      </a>
      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow text-brand-blue">{shortDate(issue.issueDate)}{issue.edition ? ` · ${issue.edition}` : ""}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-brand-navy">{paper}</h3>
        {issue.title && <p className="mt-0.5 line-clamp-2 text-xs text-brand-muted">{issue.title}</p>}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <a href={`/api/epaper/${issue.id}/download?view=1`} target="_blank" rel="noopener"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-navy hover:bg-brand-bg">
            <BookOpen className="h-4 w-4" aria-hidden /> Read
          </a>
          <a href={`/api/epaper/${issue.id}/download`} aria-label={`Download ${paper}, ${label} (${meta})`}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-navy text-xs font-semibold text-white hover:bg-brand-blue">
            <Download className="h-4 w-4" aria-hidden /> Download
          </a>
        </div>
      </div>
    </article>
  );
}