"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";
import { clientAuth as auth } from "@/lib/firebase-client";
import { TextField } from "@/components/booking/ui";

type Mode = "signin" | "signup" | "reset";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match.",
  "auth/wrong-password": "That email and password don't match.",
  "auth/user-not-found": "That email and password don't match.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Use at least 8 characters.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "",
  "auth/network-request-failed": "Network problem. Check your connection and retry.",
};

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = (value: Mode) => {
    setMode(value);
    setError("");
    setInfo("");
  };

  async function finish(user: User) {
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error?.message ?? "Could not start your session");
    }
    await signOut(auth);
    router.replace(next);
    router.refresh();
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await action();
    } catch (cause) {
      const code = cause instanceof FirebaseError ? cause.code : "";
      setError(code ? (MESSAGES[code] ?? "Something went wrong. Please try again.") :
        cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email.trim());
        setInfo("If an account exists for that email, a reset link is on its way.");
        return;
      }
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Enter your full name.");
        if (password.length < 8) throw new Error("Use at least 8 characters.");
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(user, { displayName: name.trim() });
        try {
          await sendEmailVerification(user);
        } catch {
          setInfo("Your account was created, but we couldn't send the verification email.");
        }
        await finish(user);
        return;
      }
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      await finish(user);
    });
  }

  const google = () => void run(async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await finish(result.user);
  });

  return (
    <div className="w-full max-w-md">
      {mode === "reset" ? (
        <div>
          <p className="eyebrow text-brand-blue">Account recovery</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-brand-navy">Reset your password</h1>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Account"
            className="grid grid-cols-2 rounded-xl border border-brand-border bg-brand-bg p-1">
            {(["signin", "signup"] as const).map((value) => (
              <button key={value} role="tab" type="button" aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`min-h-10 rounded-lg text-sm font-semibold transition-all ${
                  mode === value ? "bg-white text-brand-navy shadow-card" : "text-brand-muted hover:text-brand-navy"}`}>
                {value === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <h1 className="mt-8 font-display text-3xl font-semibold text-brand-navy">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </h1>
          <button type="button" onClick={google} disabled={busy}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-brand-border bg-white text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-bg disabled:opacity-60">
            <span aria-hidden className="font-bold text-[#4285F4]">G</span> Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-brand-muted">
            <span className="h-px flex-1 bg-brand-border" /> or <span className="h-px flex-1 bg-brand-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "signup" && (
          <TextField label="Full name" autoComplete="name" value={name}
            onChange={(event) => setName(event.target.value)} />
        )}
        <TextField label="Email address" type="email" autoComplete="email" value={email}
          onChange={(event) => setEmail(event.target.value)} />
        {mode !== "reset" && (
          <TextField label="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password} onChange={(event) => setPassword(event.target.value)}
            hint={mode === "signup" ? "At least 8 characters." : undefined} />
        )}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
        {info && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{info}</p>}
        <button type="submit" disabled={busy}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gold text-sm font-bold text-brand-navy shadow-sm transition-all hover:brightness-95 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-brand-muted">
        {mode === "signin" && (
          <button type="button" onClick={() => switchMode("reset")} className="font-semibold text-brand-blue hover:underline">
            Forgot your password?
          </button>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => switchMode("signin")} className="font-semibold text-brand-blue hover:underline">
            Back to sign in
          </button>
        )}
      </p>
    </div>
  );
}
