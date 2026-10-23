import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const BENEFITS = [
  "Track every booking from review to publication",
  "See payment status and your itemised price",
  "Upload artwork privately and download it later",
];

export default async function SignInPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getSession()) redirect(next);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="grid flex-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-brand-navy text-white lg:block">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative flex h-full flex-col justify-between p-14">
            <div className="rule-double-light pt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              Your account
            </div>
            <div>
              <h2 className="max-w-md font-display text-5xl font-semibold leading-[1.05]">
                Every booking, <span className="italic text-brand-gold">in one place.</span>
              </h2>
              <ul className="mt-10 space-y-4">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gold text-brand-navy">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-white/50">We never store card details. Payments go through the payment provider.</p>
          </div>
        </section>
        <section className="grid place-items-center px-4 py-12 sm:px-8">
          <AuthForm next={next} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
