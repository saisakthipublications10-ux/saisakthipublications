import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

for (const k of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
  if (!process.env[k]) throw new Error(`Missing ${k} in .env.local`);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const locations = ["Kelambakkam", "Porur", "Vadapalani", "Anna Nagar", "Chrompet"];
const newspapers = ["OMR Voice", "Tambaram Times", "Saisakthi Publications", "Velachery Mail"];
const categories = [
  "Classified", "Display", "Matrimonial", "Property",
  "Recruitment", "Business", "Public Notice", "Obituary / Remembrance",
];
const formats: [string, string][] = [
  ["Text-only classified", "text"], ["Box advertisement", "box"],
  ["Display advertisement", "display"], ["Custom advertisement", "custom"],
];

async function main() {
  const batch = db.batch();

  locations.forEach((n) =>
    batch.set(db.collection("locations").doc(slug(n)), { name: n, slug: slug(n), active: true }, { merge: true }));

  newspapers.forEach((n) =>
    batch.set(db.collection("newspapers").doc(slug(n)), {
      name: n, slug: slug(n), logoUrl: null,
      active: false,            // stays off until you configure mapping, formats and schedule
      formatIds: [], cutoffHour: 17, cutoffMinute: 0,
    }, { merge: true }));

  categories.forEach((n) =>
    batch.set(db.collection("categories").doc(slug(n)), { name: n, active: false }, { merge: true }));

  formats.forEach(([n, kind]) =>
    batch.set(db.collection("formats").doc(slug(n)), { name: n, kind, active: false }, { merge: true }));

  batch.set(db.collection("settings").doc("tax"), { gstBps: 0 }, { merge: true });

  await batch.commit();
  console.log("✓ Seeded 5 locations, 4 newspapers, 8 categories, 4 formats.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });