import { config } from "dotenv";
config({ path: ".env.local" });
import { createPrivateKey } from "node:crypto";

const raw = process.env.FIREBASE_PRIVATE_KEY ?? "";
const key = raw.replace(/\\n/g, "\n");

console.log({
  present: !!raw,
  startsOk: key.startsWith("-----BEGIN PRIVATE KEY-----"),
  endsOk: key.trim().endsWith("-----END PRIVATE KEY-----"),
  lineCount: key.trim().split("\n").length, // a normal key has about 28 lines
  hasStrayQuotes: /["']/.test(key),
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
});

try {
  createPrivateKey(key);
  console.log("✓ private key parses");
} catch (e) {
  console.log("✗", (e as Error).message);
}