"use client";
import { AdminForm, IntentButton } from "./forms";
import { bookingAction } from "@/app/admin/actions";
import { inputCls } from "./ui";
import { rupeesStr } from "@/lib/money";

export function BookingActions({ id, status, paymentStatus, totalMinor }: {
  id: string; status: string; paymentStatus: string; totalMinor: number;
}) {
  const note = (label: string, required = false) => (
    <div>
      <label htmlFor="reason" className="mb-1.5 block text-xs font-semibold text-brand-navy">{label}</label>
      <textarea id="reason" name="reason" rows={3} maxLength={500} required={required} className={inputCls} />
      <p className="mt-1 text-[11px] text-brand-muted">The customer can see this note in their booking history.</p>
    </div>
  );
  const paid = paymentStatus === "paid";

  return (
    <AdminForm action={bookingAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {status === "pending_review" && (<>
        {note("Note to customer (needed to request a correction or reject)")}
        <div className="flex flex-wrap gap-2">
          <IntentButton intent="approve" tone="gold">Approve</IntentButton>
          <IntentButton intent="request_correction" tone="outline">Request correction</IntentButton>
          <IntentButton intent="reject" tone="danger" confirm="Reject this advertisement? The date is released.">Reject</IntentButton>
        </div>
      </>)}

      {status === "awaiting_newspaper_confirmation" && (<>
        {note("Note (optional; required if rejecting)")}
        <div className="flex flex-wrap gap-2">
          <IntentButton intent="confirm" tone="gold" confirm="Confirm only after the newspaper has accepted this slot. Continue?">Newspaper confirmed the slot</IntentButton>
          <IntentButton intent="reject" tone="danger" confirm="Reject this advertisement? The date is released.">Reject</IntentButton>
        </div>
      </>)}

      {status === "confirmed" && (
        <IntentButton intent="publish" tone="gold" confirm="Record this ad as published? This tells the customer it has been printed.">Record as published</IntentButton>
      )}

      {status === "artwork_required" && (<>
        {note("Note (optional)")}
        <IntentButton intent="resume_review" tone="outline">Corrected material received: resume review</IntentButton>
      </>)}

      {status === "cancellation_requested" && (<>
        {note("Note to customer (required to decline)")}
        <div className="flex flex-wrap gap-2">
          <IntentButton intent="approve_cancel" tone="danger" confirm="Approve the cancellation? The date is released.">Approve cancellation</IntentButton>
          <IntentButton intent="decline_cancel" tone="outline">Decline and restore</IntentButton>
        </div>
      </>)}

      {(status === "rejected" || status === "cancelled") && paid && (
        <IntentButton intent="start_refund" tone="outline">Start refund</IntentButton>
      )}

      {status === "refund_pending" && (<>
        <p className="rounded-xl bg-brand-goldsoft p-3 text-xs leading-relaxed text-brand-navy">
          Issue the refund in your payment provider first, then record it here. Recording does not move any money.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="refundRef" className="mb-1.5 block text-xs font-semibold text-brand-navy">Provider refund reference</label>
            <input id="refundRef" name="refundRef" className={inputCls} />
          </div>
          <div>
            <label htmlFor="refundAmount" className="mb-1.5 block text-xs font-semibold text-brand-navy">Amount refunded (₹)</label>
            <input id="refundAmount" name="refundAmount" defaultValue={rupeesStr(totalMinor)} className={inputCls} />
          </div>
        </div>
        <IntentButton intent="record_refund" tone="gold">Record refund</IntentButton>
      </>)}

      {["pending_payment", "payment_failed", "published", "refunded", "draft"].includes(status) && (
        <p className="text-sm text-brand-muted">No actions are available for this status.</p>
      )}
    </AdminForm>
  );
}