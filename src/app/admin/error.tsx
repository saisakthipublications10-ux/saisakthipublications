"use client";
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-brand-navy">That didn&apos;t work</h1>
      <p className="mt-3 text-sm text-brand-muted">{error.message || "Something went wrong."}</p>
      <button onClick={reset} className="mt-6 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
    </div>
  );
}