import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
  }),
});

async function main() {
  const name = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (!name) throw new Error("FIREBASE_STORAGE_BUCKET is missing in .env.local");

  const extra = process.argv.slice(2).map((o) => {
    const u = new URL(o); // must be a full address like https://example.com
    return u.origin;
  });
  const origins = [...new Set(["http://localhost:3000", ...extra])];

  const bucket = getStorage().bucket(name);
  await bucket.setCorsConfiguration([
    {
      origin: origins,
      method: ["GET", "HEAD", "PUT"],
      responseHeader: ["Content-Type", "x-goog-content-length-range"],
      maxAgeSeconds: 3600,
    },
  ]);

  const [meta] = await bucket.getMetadata();
  console.log(`✓ CORS set on ${name}`);
  console.log(JSON.stringify(meta.cors, null, 2));
}
main().catch((e) => { console.error("✗", e.message); process.exit(1); });