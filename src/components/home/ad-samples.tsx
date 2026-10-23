export function AdSamples() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Classified */}
      <figure className="paper rounded-xl border border-brand-border p-5 shadow-card">
        <p className="eyebrow text-brand-blue">Classified</p>
        <div className="mt-3 border-t-2 border-brand-navy pt-3">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-navy">
            Property
          </p>
          <p className="mt-2 text-[12px] leading-[1.55] text-brand-text/80">
            <span className="font-bold">SAMPLE TEXT.</span> Your headline appears here in bold,
            followed by a few lines of body copy and a contact line. Priced by word count where
            the newspaper offers it.
          </p>
          <p className="mt-2 text-[12px] font-semibold text-brand-navy">Contact: as you enter it</p>
        </div>
        <figcaption className="mt-5 text-xs text-brand-muted">
          Text-only. Simple, economical, fast to set up.
        </figcaption>
      </figure>

      {/* Box */}
      <figure className="paper rounded-xl border border-brand-border p-5 shadow-card">
        <p className="eyebrow text-brand-blue">Box advertisement</p>
        <div className="mt-3 rounded-sm border-2 border-brand-navy p-1">
          <div className="rounded-[2px] border border-brand-navy/60 p-4 text-center">
            <p className="font-display text-lg font-bold leading-tight text-brand-navy">
              Your Headline Here
            </p>
            <div className="mx-auto my-2 h-px w-10 bg-brand-gold" />
            <p className="text-[12px] leading-relaxed text-brand-text/80">
              A bordered block that stands out on a crowded classified page.
            </p>
            <p className="mt-2 text-[11px] font-semibold tracking-wide text-brand-navy">
              CONTACT DETAILS
            </p>
          </div>
        </div>
        <figcaption className="mt-5 text-xs text-brand-muted">
          Bordered text block. More visibility on the page.
        </figcaption>
      </figure>

      {/* Display */}
      <figure className="paper rounded-xl border border-brand-border p-5 shadow-card">
        <p className="eyebrow text-brand-blue">Display advertisement</p>
        <div className="mt-3 overflow-hidden rounded-sm border border-brand-border bg-white">
          <div className="bg-brand-navy px-4 py-5">
            <p className="font-display text-xl font-bold leading-tight text-white">
              Your Brand, <span className="italic text-brand-gold">Front and Centre</span>
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4">
            <p className="text-[12px] leading-relaxed text-brand-text/80">
              Upload your own artwork or let us place your text on the page.
            </p>
            <span className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-brand-blue/50 text-[9px] font-bold uppercase text-brand-blue">
              Logo
            </span>
          </div>
        </div>
        <figcaption className="mt-5 text-xs text-brand-muted">
          Artwork, dimensions and colour options, subject to the newspaper&apos;s specs.
        </figcaption>
      </figure>
    </div>
  );
}