"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, LifeBuoy, XCircle } from "lucide-react";

async function call(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error?.message ?? `Request failed (HTTP ${response.status}).`);
  }
  return payload.data;
}

const post = (url: string, body: unknown) =>
  call(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function DownloadArtwork({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      const result = await call(`/api/bookings/${bookingId}/artwork`);
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to download artwork.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={download} disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-border bg-white px-4 text-sm font-semibold text-brand-navy hover:bg-brand-bg disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        Download artwork
      </button>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function CancelBooking({ bookingId, immediate }: { bookingId: string; immediate: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await post(`/api/bookings/${bookingId}/cancel`, { reason: reason.trim() || undefined });
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel this booking.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
        <XCircle className="h-4 w-4" aria-hidden /> {immediate ? "Cancel booking" : "Request cancellation"}
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm font-semibold text-brand-navy">{immediate ? "Cancel this booking?" : "Request cancellation?"}</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
        {immediate
          ? "No payment has been verified for this booking. Cancelling releases your selected date."
          : "Your request will be reviewed under our cancellation and refund policy. It isn't automatic and refunds depend on that policy."}
      </p>
      <label htmlFor="cancel-reason" className="mt-3 block text-xs font-semibold text-brand-navy">Reason (optional)</label>
      <textarea id="cancel-reason" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={confirm} disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Confirm
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="min-h-11 rounded-xl border border-brand-border bg-white px-4 text-sm font-semibold text-brand-navy">
          Keep booking
        </button>
      </div>
    </div>
  );
}

export function SupportForm({ bookingId, reference }: { bookingId: string; reference: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post(`/api/bookings/${bookingId}/support`, { message });
      setSent(true);
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        Message sent. We&apos;ll reply by email, quoting {reference}.
      </p>
    );
  }
  return (
    <form onSubmit={send}>
      <label htmlFor="support-message" className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
        <LifeBuoy className="h-4 w-4 text-brand-blue" aria-hidden /> Contact support about this booking
      </label>
      <textarea id="support-message" rows={4} maxLength={1000} value={message}
        onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what you need help with."
        className="mt-2 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
      <button type="submit" disabled={busy || message.trim().length < 10}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Send message
      </button>
    </form>
  );
}
