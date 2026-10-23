import { Card, Field, Page, SelectField, Toggle } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { saveCategory, saveFormat, toggleCategory, toggleFormat } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

export default async function Catalog() {
  await requireAdmin("/admin/catalog");
  const [cats, fmts] = await Promise.all([
    db.collection("categories").orderBy("name").get(),
    db.collection("formats").orderBy("name").get(),
  ]);
  return (
    <Page eyebrow="Catalog" title="Categories & formats">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Advertisement categories">
          <ul className="divide-y divide-brand-border">
            {cats.docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-brand-navy">{d.data().name}</span>
                <Toggle action={toggleCategory} id={d.id} active={!!d.data().active} />
              </li>
            ))}
          </ul>
          <AdminForm action={saveCategory} resetOnSuccess className="mt-4 flex items-end gap-2">
            <Field className="flex-1" label="New category" name="name" required />
            <SubmitButton>Add</SubmitButton>
          </AdminForm>
        </Card>

        <Card title="Advertisement formats">
          <ul className="divide-y divide-brand-border">
            {fmts.docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><span className="font-medium text-brand-navy">{d.data().name}</span> <span className="text-xs text-brand-muted">({d.data().kind})</span></span>
                <Toggle action={toggleFormat} id={d.id} active={!!d.data().active} />
              </li>
            ))}
          </ul>
          <AdminForm action={saveFormat} resetOnSuccess className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label="New format" name="name" required />
            <SelectField label="Behaves like" name="kind" defaultValue="display"
              options={[{ value: "text", label: "Text" }, { value: "box", label: "Box" }, { value: "display", label: "Display" }, { value: "custom", label: "Custom" }]} />
            <SubmitButton>Add</SubmitButton>
          </AdminForm>
          <p className="mt-3 text-[11px] text-brand-muted">&quot;Behaves like&quot; decides which fields the booking form shows (word count vs. dimensions).</p>
        </Card>
      </div>
    </Page>
  );
}