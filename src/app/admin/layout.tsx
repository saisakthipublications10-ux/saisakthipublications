import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("/admin");
  return (
    <div className="min-h-screen bg-brand-bg lg:grid lg:grid-cols-[250px_1fr]">
      <AdminNav email={user.email} />
      <main id="main" className="min-w-0">{children}</main>
    </div>
  );
}