"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Could not sign out.");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={signOut} disabled={busy} className={className}>
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <span role="alert" className="mt-1 block text-xs text-red-700">{error}</span>}
    </span>
  );
}

export function UserMenu({ name, email }: { name: string | null; email: string | null }) {
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  return (
    <details className="group relative">
      <summary aria-label="Account menu"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-brand-navy text-sm font-bold text-brand-gold [&::-webkit-details-marker]:hidden">
        {initial}
      </summary>
      <div className="absolute right-0 top-12 w-64 rounded-xl border border-brand-border bg-white p-2 shadow-lift">
        <div className="border-b border-brand-border px-3 pb-3 pt-2">
          {name && <p className="truncate text-sm font-semibold text-brand-navy">{name}</p>}
          {email && <p className="truncate text-xs text-brand-muted">{email}</p>}
        </div>
        <Link href="/dashboard" className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-brand-bg">
          My bookings
        </Link>
        <SignOutButton className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-muted hover:bg-brand-bg" />
      </div>
    </details>
  );
}
