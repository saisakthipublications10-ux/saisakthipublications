"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileImage, FileText, Loader2, X } from "lucide-react";
import { createEpaper } from "@/app/admin/epaper/action";
import { EPAPER, fmtSize } from "@/lib/epaper-shared";
import { inputCls } from "./ui";

type Phase = "idle" | "pdf" | "cover" | "saving";

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error?.message ?? "Request failed");
  return j.data as T;
}

function put(url: string, file: File, type: string, range: string, onProgress: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", type);
    x.setRequestHeader("x-goog-content-length-range", range);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")));
    x.onerror = () => reject(new Error("Network error during upload. If this keeps happening, check the storage bucket's CORS settings."));
    x.send(file);
  });
}

const typeOf = (f: File) => f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "");

function FilePick({ label, hint, icon: Icon, accept, file, onPick, disabled }: {
  label: string; hint: string; icon: typeof FileText; accept: string;
  file: File | null; onPick: (f: File | null) => void; disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-brand-navy">{label}</p>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg p-3">
          <Icon className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-navy">{file.name}</p>
            <p className="text-xs text-brand-muted">{fmtSize(file.size)}</p>
          </div>
          <button type="button" disabled={disabled} onClick={() => onPick(null)} aria-label={`Remove ${file.name}`}
            className="grid h-8 w-8 place-items-center rounded-full border border-brand-border bg-white hover:bg-brand-bg">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" disabled={disabled} onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files[0] ?? null); }}
          className="grid w-full place-items-center rounded-xl border-2 border-dashed border-brand-border bg-brand-bg px-4 py-7 text-center hover:border-brand-blue">
          <Icon className="h-6 w-6 text-brand-blue" aria-hidden />
          <span className="mt-2 text-sm font-semibold text-brand-navy">Choose or drop a file</span>
          <span className="text-xs text-brand-muted">{hint}</span>
        </button>
      )}
      <input ref={input} type="file" accept={accept} className="sr-only"
        onChange={(e) => { onPick(e.target.files?.[0] ?? null); e.target.value = ""; }} />
    </div>
  );
}

export function EpaperUploader({ newspapers, today }: { newspapers: { id: string; name: string }[]; today: string }) {
  const router = useRouter();
  const [newspaperId, setNewspaperId] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [edition, setEdition] = useState("");
  const [title, setTitle] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [publish, setPublish] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const busy = phase !== "idle";

  async function upload(kind: "pdf" | "cover", file: File) {
    setPhase(kind); setProgress(0);
    const contentType = typeOf(file);
    const sign = await post<{ uploadId: string; url: string; sizeRange: string }>("/api/admin/epaper/sign", {
      kind, newspaperId, issueDate, fileName: file.name, contentType, size: file.size,
    });
    await put(sign.url, file, contentType, sign.sizeRange, setProgress);
    await post("/api/admin/epaper/finalize", { uploadId: sign.uploadId });
    return sign.uploadId;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setDone("");
    if (!newspaperId) return setError("Choose a newspaper.");
    if (!issueDate) return setError("Choose the issue date.");
    if (!pdf) return setError("Choose the PDF file.");
    if (typeOf(pdf) !== "application/pdf") return setError("The issue must be a PDF.");
    if (pdf.size > EPAPER.maxPdfBytes) return setError(`The PDF is larger than ${fmtSize(EPAPER.maxPdfBytes)}. Compress it and try again.`);
    if (cover && !["image/jpeg", "image/png"].includes(cover.type)) return setError("The cover must be a JPEG or PNG image.");
    if (cover && cover.size > EPAPER.maxCoverBytes) return setError(`The cover is larger than ${fmtSize(EPAPER.maxCoverBytes)}.`);

    try {
      const pdfUploadId = await upload("pdf", pdf);
      const coverUploadId = cover ? await upload("cover", cover) : null;
      setPhase("saving");
      const res = await createEpaper({ newspaperId, issueDate, edition, title, pdfUploadId, coverUploadId, publish });
      if (!res.ok) throw new Error(res.message ?? "Could not save the issue.");
      setDone(res.message ?? "Done");
      setPdf(null); setCover(null); setEdition(""); setTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPhase("idle");
    }
  }

  const label = { idle: "", pdf: "Uploading the PDF…", cover: "Uploading the cover…", saving: "Saving the issue…" }[phase];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="ep-paper" className="mb-1.5 block text-xs font-semibold text-brand-navy">Newspaper</label>
          <select id="ep-paper" value={newspaperId} onChange={(e) => setNewspaperId(e.target.value)} disabled={busy} className={inputCls}>
            <option value="">Choose…</option>
            {newspapers.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ep-date" className="mb-1.5 block text-xs font-semibold text-brand-navy">Issue date</label>
          <input id="ep-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={busy} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ep-edition" className="mb-1.5 block text-xs font-semibold text-brand-navy">Edition <span className="font-normal text-brand-muted">(optional)</span></label>
          <input id="ep-edition" value={edition} maxLength={40} onChange={(e) => setEdition(e.target.value)} disabled={busy}
            placeholder="e.g. Chennai, Morning" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ep-title" className="mb-1.5 block text-xs font-semibold text-brand-navy">Headline <span className="font-normal text-brand-muted">(optional)</span></label>
          <input id="ep-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} disabled={busy} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FilePick label="Issue PDF" hint="PDF, up to 100 MB" icon={FileText} accept="application/pdf,.pdf" file={pdf} onPick={setPdf} disabled={busy} />
        <FilePick label="Cover image (front page)" hint="JPEG or PNG, up to 3 MB. Optional" icon={FileImage} accept="image/jpeg,image/png" file={cover} onPick={setCover} disabled={busy} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border bg-white px-3.5 py-3">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} disabled={busy} className="mt-0.5 h-4 w-4 accent-[#102C46]" />
        <span>
          <span className="block text-sm font-medium text-brand-navy">Publish immediately</span>
          <span className="block text-[11px] text-brand-muted">Untick to save as a draft and publish later from the list below.</span>
        </span>
      </label>

      {busy && (
        <div aria-live="polite">
          <p className="mb-1.5 text-xs font-semibold text-brand-navy">{label}{phase === "pdf" || phase === "cover" ? ` ${progress}%` : ""}</p>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "saving" ? 100 : progress}
            className="h-1.5 overflow-hidden rounded-full bg-brand-border">
            <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${phase === "saving" ? 100 : progress}%` }} />
          </div>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
      {done && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{done}</p>}

      <button type="submit" disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-gold px-6 text-sm font-bold text-brand-navy hover:brightness-95 disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Upload issue
      </button>
    </form>
  );
}