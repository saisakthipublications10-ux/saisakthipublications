export function EpaperCover({ id, hasCover, paper, date }: { id: string; hasCover: boolean; paper: string; date: string }) {
  if (hasCover)
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/epaper/${id}/cover`} alt={`Front page of ${paper}, ${date}`} loading="lazy" decoding="async"
          className="h-full w-full object-cover object-top" />
      </>
    );

  return (
    <div aria-hidden className="paper flex h-full w-full flex-col p-5">
      <div className="border-y-[3px] border-double border-brand-navy py-3 text-center">
        <p className="font-display text-xl font-semibold leading-tight text-brand-navy">{paper}</p>
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-muted">{date}</p>
      <div className="mt-4 h-24 rounded-sm bg-brand-navy/10" />
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-11/12 rounded bg-brand-navy/70" />
        <div className="h-1.5 w-full rounded bg-brand-text/15" />
        <div className="h-1.5 w-10/12 rounded bg-brand-text/15" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((c) => (
          <div key={c} className="space-y-1.5">
            {[0, 1, 2, 3, 4, 5].map((l) => <div key={l} className={`h-1 rounded bg-brand-text/15 ${l % 3 === 2 ? "w-2/3" : "w-full"}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}