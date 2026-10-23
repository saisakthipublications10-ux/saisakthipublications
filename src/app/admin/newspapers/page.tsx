import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge, Card, Field, Page, Toggle } from "@/components/admin/ui";
import { AdminForm, SubmitButton } from "@/components/admin/forms";
import { createNewspaper, toggleNewspaper } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const metadata = { title: "Newspapers" };
export const dynamic = "force-dynamic";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function Newspapers() {
  await requireAdmin("/admin/newspapers");
  const [papers, maps, scheds, rules, fmts] = await Promise.all([
    db.collection("newspapers").orderBy("name").get(),
    db.collection("newspaperLocations").where("active", "==", true).get(),
    db.collection("publicationSchedules").get(),
    db.collection("pricingRules").where("active", "==", true).get(),
    db.collection("formats").get(),
  ]);
  const fmtName = Object.fromEntries(fmts.docs.map((d) => [d.id, d.data().name as string]));
  const sched = Object.fromEntries(scheds.docs.map((d) => [d.id, d.data()]));
  const priced = new Set(rules.docs.map((d) => `${d.data().newspaperId}_${d.data().formatId}`));

  return (
    <Page eyebrow="Catalog" title="Newspapers">
      <div className="grid gap-4">
        {papers.docs.map((d) => {
          const p = d.data();
          const locCount = maps.docs.filter((m) => m.data().newspaperId === d.id).length;
          const days = ((sched[d.id]?.weekdays as number[]) ?? []).map((w) => DAYS[w]).join(", ");
          const unpriced = ((p.formatIds as string[]) ?? []).filter((f) => !priced.has(`${d.id}_${f}`)).map((f) => fmtName[f] ?? f);
          const issues = [
            !locCount && "No locations mapped",
            !(p.formatIds as string[])?.length && "No formats offered",
            !days && "No publication days",
            unpriced.length > 0 && `No price for: ${unpriced.join(", ")}`,
          ].filter(Boolean) as string[];

          return (
            <section key={d.id} className="rounded-2xl border border-brand-border bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-brand-navy">{p.name}</h2>
                  <p className="mt-1 text-xs text-brand-muted">{locCount} location(s) · {days || "no schedule"} · {(p.formatIds as string[])?.length ?? 0} format(s)</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={p.active ? "green" : "neutral"}>{p.active ? "Live" : "Disabled"}</Badge>
                  <Toggle action={toggleNewspaper} id={d.id} active={!!p.active} />
                  <Link href={`/admin/newspapers/${d.id}`} className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue">Configure</Link>
                </div>
              </div>
              {issues.length > 0 && (
                <ul className="mt-4 space-y-1 rounded-xl bg-brand-goldsoft p-3 text-xs text-brand-navy">
                  {issues.map((i) => <li key={i} className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {i}</li>)}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <Card title="Add a newspaper">
        <AdminForm action={createNewspaper} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <Field className="min-w-64 flex-1" label="Newspaper name" name="name" required maxLength={80} />
          <SubmitButton>Add newspaper</SubmitButton>
        </AdminForm>
      </Card>
    </Page>
  );
}