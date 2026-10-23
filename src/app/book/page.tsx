import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingWizard } from "../../components/booking/wizard";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Book an Advertisement",
  description:
    "Choose your neighbourhood and newspaper, pick an available publication date, and see an itemised price before you pay.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: { location?: string; format?: string };
}) {
  const user = await getSession();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden bg-brand-navy text-white">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
            <p className="eyebrow text-brand-gold">Book an advertisement</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Let&apos;s set up your <span className="italic text-brand-gold">publication.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Seven short steps. Your progress is saved on this device for 24 hours, and
              nothing is charged until you confirm.
            </p>
          </div>
        </section>

        <div className="relative z-10 -mt-12 pb-10">
          <BookingWizard
            initialLocation={searchParams.location}
            preferredFormat={searchParams.format}
            user={user ? { name: user.name, email: user.email } : null}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}