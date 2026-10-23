"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Loader2, LogIn, ShieldCheck, Upload, X } from "lucide-react";
import type { ArtState } from "./use-artwork";

const ACCEPT = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024;
const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function ArtworkDropzone({
  signedIn,
  art,
  onPick,
  onRemove,
}: {
  signedIn: boolean;
  art: ArtState;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setThumbnail(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setThumbnail(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(next?: File) {
    if (!next) return;
    if (!ACCEPT.includes(next.type)) {
      setClientError("Use a PDF, PNG or JPEG file.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setClientError("File must be under 10 MB.");
      return;
    }
    setClientError("");
    setFile(next);
    onPick(next);
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-bg p-6 text-center">
        <LogIn className="mx-auto h-7 w-7 text-brand-blue" aria-hidden />
        <p className="mt-3 font-display text-lg font-semibold text-brand-navy">Sign in to upload artwork</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-brand-muted">
          Your artwork is kept private to your account. Your progress is saved on this device.
        </p>
        <Link href="/signin?next=/book"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white hover:bg-brand-blue">
          Sign in or create an account
        </Link>
      </div>
    );
  }

  const busy = art.phase === "uploading" || art.phase === "verifying";
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-brand-navy">Artwork file</p>
      {art.phase === "idle" || art.phase === "error" ? (
        <>
          <button type="button" onClick={() => input.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); pick(event.dataTransfer.files[0]); }}
            className="grid w-full place-items-center rounded-xl border-2 border-dashed border-brand-border bg-brand-bg px-6 py-10 text-center transition-colors hover:border-brand-blue">
            <Upload className="h-7 w-7 text-brand-blue" aria-hidden />
            <span className="mt-3 text-sm font-semibold text-brand-navy">Drop a file here or browse</span>
            <span className="mt-1 text-xs text-brand-muted">PDF, PNG or JPEG · up to 10 MB</span>
          </button>
          <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only"
            onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} />
        </>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-brand-border bg-white p-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-brand-border bg-brand-bg">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            ) : <FileText className="h-6 w-6 text-brand-blue" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-navy">{art.name}</p>
            <p className="text-xs text-brand-muted">{art.size ? formatSize(art.size) : ""}</p>
            {art.phase === "uploading" && (
              <div className="mt-2">
                <div role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100}
                  aria-valuenow={art.progress ?? 0} className="h-1.5 overflow-hidden rounded-full bg-brand-border">
                  <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${art.progress ?? 0}%` }} />
                </div>
                <p className="mt-1 text-xs tabular-nums text-brand-muted">Uploading… {art.progress ?? 0}%</p>
              </div>
            )}
            {art.phase === "verifying" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-muted" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking your file…
              </p>
            )}
            {art.phase === "ready" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700" aria-live="polite">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Uploaded and verified
              </p>
            )}
          </div>
          <button type="button" onClick={() => { onRemove(); setFile(null); setClientError(""); }}
            aria-label={busy ? "Cancel upload" : "Remove file"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-border hover:bg-brand-bg">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
      {(clientError || art.phase === "error") && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {clientError || art.error}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-brand-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden />
        File type and size are verified on our server. Artwork must meet the selected newspaper&apos;s specifications.
      </p>
    </div>
  );
}
