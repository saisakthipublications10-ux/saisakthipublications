"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { Result } from "@/lib/admin-types";

const TONE = {
  primary: "bg-brand-navy text-white hover:bg-brand-blue",
  gold: "bg-brand-gold text-brand-navy hover:brightness-95",
  danger: "bg-red-700 text-white hover:bg-red-800",
  outline: "border border-brand-border bg-white text-brand-navy hover:bg-brand-bg",
};
type Tone = keyof typeof TONE;
const base = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all disabled:opacity-60";

export function AdminForm({ action, children, className = "", resetOnSuccess = false }: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  children: ReactNode; className?: string; resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useFormState(action, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.message && (
        <p role={state.ok ? "status" : "alert"}
          className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}


export function SubmitButton({ children, tone = "primary", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${base} ${TONE[tone]} ${className}`}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {children}
    </button>
  );
}

/** Submit button that sends an `intent` value, with an optional confirm dialog. */
export function IntentButton({ intent, children, tone = "primary", confirm }: {
  intent: string; children: ReactNode; tone?: Tone; confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="intent" value={intent} disabled={pending} className={`${base} ${TONE[tone]}`}
      onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

export function ConfirmSubmit({ children, confirm, className = "" }: { children: ReactNode; confirm: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}
      onClick={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>
      {children}
    </button>
  );
}