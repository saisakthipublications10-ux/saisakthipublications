import Link from "next/link";
import { Badge, Card, Page } from "@/components/admin/ui";
import { resolveSupport } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import type { Timestamp } from "firebase-admin/firestore";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

type SupportMessage = {
  id: string;
  status: string;
  email: string;
  createdAt?: Timestamp;
  bookingRef: string;
  message: string;
};

export default async function Support() {
  await requireAdmin("/admin/support");
  const snap = await db.collection("supportMessages").orderBy("createdAt", "desc").limit(100).get();
  const items: SupportMessage[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportMessage);
  const open = items.filter((i) => i.status === "open");
  const done = items.filter((i) => i.status !== "open");

  const render = (list: typeof items, canResolve: boolean) =>
    list.map((m) => (
      <Card key={m.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-navy">{m.email}</p>
            <p className="text-xs text-brand-muted">{m.createdAt?.toDate().toLocaleString("en-IN")} · booking <Link className="font-semibold text-brand-blue" href={`/admin/bookings?q=${m.bookingRef}`}>{m.bookingRef}</Link></p>
          </div>
          {canResolve ? (
            <form action={resolveSupport}><input type="hidden" name="id" value={m.id} />
              <button className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-bg">Mark resolved</button>
            </form>
          ) : <Badge tone="green">Resolved</Badge>}
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-brand-bg p-3 text-sm">{m.message}</p>
        <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.bookingRef}`)}`} className="mt-3 inline-block text-xs font-semibold text-brand-blue">Reply by email</a>
      </Card>
    ));

  return (
    <Page eyebrow="Customers" title="Support inbox">
      <h2 className="font-display text-xl font-semibold text-brand-navy">Open ({open.length})</h2>
      {open.length ? render(open, true) : <p className="text-sm text-brand-muted">No open messages.</p>}
      {done.length > 0 && (<><h2 className="pt-4 font-display text-xl font-semibold text-brand-navy">Resolved</h2>{render(done, false)}</>)}
    </Page>
  );
}