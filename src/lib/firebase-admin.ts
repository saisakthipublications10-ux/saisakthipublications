import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function normalizeKey(raw?: string) {
  if (!raw) return undefined;
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
  return k.replace(/\\n/g, "\n");
}

let cached: App | undefined;
function app(): App {
  if (cached) return cached;
  cached =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizeKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  return cached;
}

/** Connects on first use, so `next build` never needs credentials. */
function lazy<T extends object>(make: () => T): T {
  let inst: T | undefined;
  return new Proxy({} as T, {
    get(_t, prop) {
      inst ??= make();
      const v = Reflect.get(inst, prop, inst);
      return typeof v === "function" ? v.bind(inst) : v;
    },
  });
}

export const db = lazy(() => getFirestore(app()));
export const storage = lazy(() => getStorage(app()));
export const adminAuth = lazy(() => getAuth(app()));
export const adminDb = db;
export const adminStorage = storage;