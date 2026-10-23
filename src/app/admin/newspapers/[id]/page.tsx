import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CheckField, Field, Page } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { saveNewspaper } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const metadata = { title: "Configure newspaper" };
export const dynamic = "force-dynamic";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ConfigureNewspaper({ params }: { params: { id: string } }) {
  await requireAdmin(`/admin/newspapers/${params.id}`);
  const paperSnap = await db.collection("newspapers").doc(params.id).get();
  if (!paperSnap.exists) notFound();
  const p = paperSnap.data()!;

  const [locs, fmts, maps, schedSnap] = await Promise.all([
    db.collection("locations").orderBy("name").get(),
    db.collection("formats").orderBy("name").get(),
    db.collection("newspaperLocations").where("newspaperId", "==", params.id).get(),
    db.collection("publicationSchedules").doc(params.id).get(),
  ]);
  const mapped = new Set(maps.docs.filter((m) => m.data().active).map((m) => m.data().locationId as string));
  const s = schedSnap.data() ?? { weekdays: [], holidays: [], horizonDays: 60, cutoffHour: p.cutoffHour ?? 17, cutoffMinute: p.cutoffMinute ?? 0 };

  return (
    <Page eyebrow="Newspaper" title={p.name}
      actions={<Link href="/admin/newspapers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue"><ArrowLeft className="h-4 w-4" aria-hidden /> All newspapers</Link>}>
      <AdminForm action={saveNewspaper} className="space-y-6">
        <input type="hidden" name="id" value={params.id} />

        <Card title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={p.name} required maxLength={80} />
            <div className="self-end"><CheckField label="Live on the booking site" name="active" defaultChecked={!!p.active}
              hint="Needs at least one location, one format and one publication day." /></div>
          </div>
        </Card>

        <Card title="Locations it serves">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {locs.docs.map((l) => <CheckField key={l.id} label={l.data().name} name="locations" value={l.id} defaultChecked={mapped.has(l.id)} />)}
          </div>
        </Card>

        <Card title="Advertisement formats offered">
          <div className="grid gap-2 sm:grid-cols-2">
            {fmts.docs.map((f) => (
              <CheckField key={f.id} label={f.data().name} name="formats" value={f.id}
                defaultChecked={(p.formatIds as string[] | undefined)?.includes(f.id)}
                hint={f.data().active ? undefined : "Disabled in Catalog, so customers won't see it"} />
            ))}
          </div>
        </Card>

        <Card title="Publication schedule">
          <p className="mb-3 text-xs font-semibold text-brand-navy">Publishes on</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {DAYS.map((d, i) => <CheckField key={d} label={d} name="weekdays" value={String(i)} defaultChecked={(s.weekdays as number[]).includes(i)} />)}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Cut-off hour (0–23, the day before)" name="cutoffHour" type="number" min={0} max={23} defaultValue={s.cutoffHour} />
            <Field label="Cut-off minute" name="cutoffMinute" type="number" min={0} max={59} defaultValue={s.cutoffMinute} />
            <Field label="Bookable days ahead" name="horizonDays" type="number" min={7} max={365} defaultValue={s.horizonDays} />
          </div>
          <div className="mt-5">
            <label htmlFor="holidays" className="mb-1.5 block text-xs font-semibold text-brand-navy">Holidays (no edition), one date per line, YYYY-MM-DD</label>
            <textarea id="holidays" name="holidays" rows={4} defaultValue={(s.holidays as string[]).join("\n")}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
          </div>
          <p className="mt-2 text-[11px] text-brand-muted">Cut-off times are in India time. Close or cap individual dates under Availability.</p>
        </Card>

        <SubmitButton tone="gold">Save newspaper</SubmitButton>
      </AdminForm>
    </Page>
  );
}