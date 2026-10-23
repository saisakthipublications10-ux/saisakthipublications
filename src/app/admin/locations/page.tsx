import { Card, Field, Page, Toggle, td, th } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { saveLocation, toggleLocation } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const metadata = { title: "Locations" };
export const dynamic = "force-dynamic";

export default async function Locations() {
  await requireAdmin("/admin/locations");
  const snap = await db.collection("locations").orderBy("name").get();
  return (
    <Page eyebrow="Catalog" title="Locations">
      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-brand-border bg-brand-bg"><tr><th className={th}>Name</th><th className={th}>Rename</th><th className={`${th} text-right`}>Enabled</th></tr></thead>
          <tbody className="divide-y divide-brand-border">
            {snap.docs.map((d) => (
              <tr key={d.id}>
                <td className={td}><span className="font-semibold text-brand-navy">{d.data().name}</span><p className="text-[11px] text-brand-muted">{d.id}</p></td>
                <td className={td}>
                  <AdminForm action={saveLocation} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={d.id} />
                    <input name="name" defaultValue={d.data().name} aria-label={`Rename ${d.data().name}`} className="w-44 rounded-lg border border-brand-border px-3 py-1.5 text-sm" />
                    <SubmitButton tone="outline" className="!min-h-8 !px-3 text-xs">Save</SubmitButton>
                  </AdminForm>
                </td>
                <td className={`${td} flex justify-end`}><Toggle action={toggleLocation} id={d.id} active={!!d.data().active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Add a location">
        <AdminForm action={saveLocation} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <Field className="min-w-64 flex-1" label="Location name" name="name" required maxLength={60} />
          <SubmitButton>Add location</SubmitButton>
        </AdminForm>
        <p className="mt-3 text-[11px] text-brand-muted">New locations appear on the site once a newspaper is mapped to them.</p>
      </Card>
    </Page>
  );
}