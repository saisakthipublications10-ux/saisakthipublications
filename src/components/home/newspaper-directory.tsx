import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { db } from "@/lib/firebase-admin";

export async function NewspaperDirectory() {
  let papers: { id: string; name: string; locations: string[] }[] = [];
  try {
    const [paperSnap, mapSnap, locSnap] = await Promise.all([
      db.collection("newspapers").where("active", "==", true).get(),
      db.collection("newspaperLocations").where("active", "==", true).get(),
      db.collection("locations").where("active", "==", true).get(),
    ]);
    const locName = Object.fromEntries(locSnap.docs.map((d) => [d.id, d.data().name as string]));
    papers = paperSnap.docs
      .map((d) => ({
        id: d.id,
        name: d.data().name as string,
        locations: mapSnap.docs
          .filter((m) => m.data().newspaperId === d.id)
          .map((m) => locName[m.data().locationId as string])
          .filter(Boolean)
          .sort(),
      }))
      .filter((p) => p.locations.length > 0) // only newspapers a customer can actually book
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    /* fall through to the empty state */
  }

  if (papers.length === 0)
    return (
      <p className="mt-12 rounded-2xl border border-dashed border-brand-border bg-brand-bg p-8 text-center text-sm text-brand-muted">
        Newspapers will be listed here as soon as they are available for booking.
      </p>
    );

  return (
    <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {papers.map((p) => (
        <li key={p.id}>
          <Link
            href="/book"
            className="group flex h-full flex-col rounded-xl border border-brand-border bg-brand-bg p-6 transition-all hover:-translate-y-1 hover:border-brand-navy hover:shadow-lift"
          >
            <div className="border-y-[3px] border-double border-brand-navy py-5 text-center">
              <Newspaper className="mx-auto h-5 w-5 text-brand-gold" aria-hidden />
              <p className="mt-2 font-display text-[1.7rem] font-semibold leading-none tracking-tight text-brand-navy">
                {p.name}
              </p>
            </div>
            <p className="mt-5 flex-1 text-xs leading-relaxed text-brand-muted">
              Available in {p.locations.join(", ")}.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue group-hover:text-brand-navy">
              Book an ad
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}