"use client";

import { useCallback, useRef, useState } from "react";

export interface ArtState {
  phase: "idle" | "uploading" | "verifying" | "ready" | "error";
  progress?: number;
  uploadId?: string;
  name?: string;
  size?: number;
  error?: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error?.message ?? `Request failed (HTTP ${response.status}).`);
  }
  return result.data as T;
}

export function useArtwork() {
  const [state, setState] = useState<ArtState>({ phase: "idle" });
  const xhr = useRef<XMLHttpRequest | null>(null);
  const operation = useRef(0);

  const reset = useCallback(() => {
    operation.current += 1;
    xhr.current?.abort();
    xhr.current = null;
    setState({ phase: "idle" });
  }, []);

  const start = useCallback(async (file: File) => {
    const currentOperation = ++operation.current;
    setState({ phase: "uploading", progress: 0, name: file.name, size: file.size });
    try {
      const signed = await post<{ uploadId: string; url: string; sizeRange: string }>("/api/uploads/sign", {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (operation.current !== currentOperation) return;

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        xhr.current = request;
        request.open("PUT", signed.url);
        request.setRequestHeader("Content-Type", file.type);
        request.setRequestHeader("x-goog-content-length-range", signed.sizeRange);
        request.upload.onprogress = (event) => {
          if (event.lengthComputable && operation.current === currentOperation) {
            setState((current) => ({
              ...current,
              phase: "uploading",
              progress: Math.round((event.loaded / event.total) * 100),
            }));
          }
        };
        request.onload = () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : reject(new Error("Upload failed. Please try again."));
        request.onerror = () => reject(new Error("Network error during upload. Please try again."));
        request.onabort = () => reject(new Error("aborted"));
        request.send(file);
      });
      if (operation.current !== currentOperation) return;

      setState((current) => ({ ...current, phase: "verifying" }));
      await post("/api/uploads/finalize", { uploadId: signed.uploadId });
      if (operation.current === currentOperation) {
        setState({ phase: "ready", uploadId: signed.uploadId, name: file.name, size: file.size });
      }
    } catch (error) {
      if (operation.current !== currentOperation) return;
      const message = error instanceof Error ? error.message : "Upload failed";
      if (message !== "aborted") setState({ phase: "error", error: message, name: file.name, size: file.size });
    } finally {
      if (operation.current === currentOperation) xhr.current = null;
    }
  }, []);

  return { state, start, reset };
}
