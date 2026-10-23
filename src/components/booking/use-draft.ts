"use client";
import { useCallback, useEffect, useState } from "react";
import { Draft, emptyDraft } from "./types";

const KEY = "nt-booking-draft-v1";
const TTL = 24 * 60 * 60 * 1000; // drafts expire after 24h

export function useDraft() {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (Date.now() - d.updatedAt < TTL && d.key) {
          setDraft({ ...d, acceptTerms: false, file: null }); // never restore consent or file
          setHydrated(true);
          return;
        }
        localStorage.removeItem(KEY);
      }
    } catch { /* storage unavailable: continue without persistence */ }
    setDraft(emptyDraft(crypto.randomUUID()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft, hydrated]);

  const patch = useCallback(
    (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p, updatedAt: Date.now() })),
    []
  );

  const clear = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setDraft(emptyDraft(crypto.randomUUID()));
  }, []);

  return { draft, patch, clear, hydrated };
}