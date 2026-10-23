"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, LayoutTemplate } from "lucide-react";

const LOCATIONS = [
  { id: "kelambakkam", name: "Kelambakkam" },
  { id: "porur", name: "Porur" },
  { id: "vadapalani", name: "Vadapalani" },
  { id: "anna-nagar", name: "Anna Nagar" },
  { id: "chrompet", name: "Chrompet" },
];

const FORMATS = [
  { id: "text-only-classified", name: "Text classified" },
  { id: "box-advertisement", name: "Box ad" },
  { id: "display-advertisement", name: "Display ad" },
  { id: "custom-advertisement", name: "Custom" },
];

export function BookingLauncher({ initialLocation = "" }: { initialLocation?: string }) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [format, setFormat] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (format) params.set("format", format);
    router.push(`/book${params.size ? `?${params}` : ""}`);
  }

  const pill = (active: boolean) =>
    `cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all
     peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2
     peer-focus-visible:outline-brand-gold
     ${
       active
         ? "border-brand-navy bg-brand-navy text-white shadow-sm"
         : "border-brand-border bg-white text-brand-text hover:border-brand-blue"
     }`;

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Start your advertisement booking"
      className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-lift sm:p-7"
    >
      <div className="grid gap-7 lg:grid-cols-[1.4fr_1fr_auto] lg:items-end">
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 eyebrow text-brand-muted">
            <MapPin className="h-3.5 w-3.5 text-brand-blue" aria-hidden /> Neighbourhood
          </legend>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((l) => (
              <label key={l.id} className="relative">
                <input
                  type="radio"
                  name="location"
                  value={l.id}
                  checked={location === l.id}
                  onChange={() => setLocation(l.id)}
                  className="peer sr-only"
                />
                <span className={pill(location === l.id)}>{l.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 flex items-center gap-2 eyebrow text-brand-muted">
            <LayoutTemplate className="h-3.5 w-3.5 text-brand-blue" aria-hidden /> Ad format
            <span className="font-medium normal-case tracking-normal text-brand-muted/70">
              (optional)
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <label key={f.id} className="relative">
                <input
                  type="radio"
                  name="format"
                  value={f.id}
                  checked={format === f.id}
                  onChange={() => setFormat(f.id)}
                  className="peer sr-only"
                />
                <span className={pill(format === f.id)}>{f.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-7 py-3 text-sm font-bold text-brand-navy shadow-sm transition-all hover:brightness-95 active:scale-[.98]"
        >
          Continue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>

      <p className="mt-5 border-t border-brand-border pt-4 text-xs text-brand-muted">
        Next you will see only the newspapers the administrator has mapped to your
        neighbourhood, along with live publication dates.
      </p>
    </form>
  );
}