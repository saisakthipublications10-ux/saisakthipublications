import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireApiUser } from "@/lib/auth";
import { HttpError, route } from "@/lib/api";
import { filteredBookings } from "@/lib/admin-bookings";
import { rateLimit } from "@/lib/security";
import { rupeesStr } from "@/lib/money";
import { nameMap } from "@/lib/bookings-read";

type ExportBooking = {
  id: string;
  reference: string;
  createdAt?: { toDate: () => Date } | null;
  status: string;
  paymentStatus: string;
  newspaperId: string;
  locationId: string;
  categoryId: string;
  formatId: string;
  publicationDate: string;
  customer?: { name?: string; email?: string; phone?: string };
  totalMinor?: number;
};

// Spreadsheet formula-injection guard: cells starting with = + - @ get a leading apostrophe
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET = route(async (req: NextRequest) => {
  const user = await requireApiUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  await rateLimit(`export:${user.uid}`, 10, 3600);

  const { q } = filteredBookings(Object.fromEntries(req.nextUrl.searchParams));
  const snap = await q.limit(5000).get();
  const rows: ExportBooking[] = snap.docs.map((d) => ({
    ...d.data(),
    id: d.id,
  }) as ExportBooking);

  const [papers, locs, cats, fmts] = await Promise.all([
    nameMap("newspapers", rows.map((r) => r.newspaperId)),
    nameMap("locations", rows.map((r) => r.locationId)),
    nameMap("categories", rows.map((r) => r.categoryId)),
    nameMap("formats", rows.map((r) => r.formatId)),
  ]);

  const head = ["Reference", "Created", "Status", "Payment", "Newspaper", "Location", "Category", "Format",
    "Publication date", "Customer", "Email", "Mobile", "Total (INR)"];
  const lines = [head.join(",")];
  for (const r of rows)
    lines.push([
      r.reference, r.createdAt?.toDate().toISOString() ?? "", r.status, r.paymentStatus,
      papers[r.newspaperId], locs[r.locationId], cats[r.categoryId], fmts[r.formatId],
      r.publicationDate, r.customer?.name, r.customer?.email, r.customer?.phone, rupeesStr(r.totalMinor ?? 0),
    ].map(cell).join(","));

  await db.collection("auditLogs").add({
    actor: user.uid, actorEmail: user.email, action: "bookings.export", target: "bookings",
    meta: { rows: rows.length, filters: Object.fromEntries(req.nextUrl.searchParams) }, at: FieldValue.serverTimestamp(),
  });

  return new Response("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});