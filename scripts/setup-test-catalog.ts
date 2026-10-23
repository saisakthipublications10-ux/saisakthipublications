import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to run test setup in production.");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

/* ───────── ⚠ TEST DATA: replace with your real business rules ───────── */

// which newspaper serves which locations
const COVERAGE: Record<string, string[]> = {
  "omr-voice": ["kelambakkam", "porur"],
  "tambaram-times": ["chrompet", "kelambakkam"],
  "nanganallur-times": ["chrompet", "vadapalani", "anna-nagar"],
  "velachery-mail": ["vadapalani", "anna-nagar", "porur"],
};

// formats every newspaper offers in this test setup
const FORMATS_OFFERED = ["text-only-classified", "box-advertisement", "display-advertisement"];

// publication days: 0 = Sunday … 6 = Saturday; cut-off is 17:00 the day before
const SCHEDULE = { weekdays: [0, 3, 5], holidays: [] as string[], horizonDays: 60, cutoffHour: 17, cutoffMinute: 0 };

// TEST RATES in paise (1000 = ₹10.00). Not real prices.
const RATES: Record<string, { mode: "flat" | "per_word" | "per_cm2"; rateMinor: number; minChargeMinor: number; colourSurchargeMinor: number }> = {
  "text-only-classified": { mode: "per_word", rateMinor: 1000, minChargeMinor: 15000, colourSurchargeMinor: 0 },
  "box-advertisement": { mode: "flat", rateMinor: 50000, minChargeMinor: 0, colourSurchargeMinor: 10000 },
  "display-advertisement": { mode: "per_cm2", rateMinor: 800, minChargeMinor: 30000, colourSurchargeMinor: 20000 },
};

/* ──────────────────────────────────────────────────────────────────────── */

const CATEGORY_IDS = ["classified", "display", "matrimonial", "property", "recruitment", "business", "public-notice", "obituary-remembrance"];
const FORMAT_IDS = ["text-only-classified", "box-advertisement", "display-advertisement", "custom-advertisement"];

async function main() {
  const batch = db.batch();
  const today = new Date().toISOString().slice(0, 10);

  for (const [paper, locs] of Object.entries(COVERAGE)) {
    batch.set(db.collection("newspapers").doc(paper),
      { active: true, formatIds: FORMATS_OFFERED, cutoffHour: SCHEDULE.cutoffHour, cutoffMinute: SCHEDULE.cutoffMinute },
      { merge: true });

    for (const loc of locs)
      batch.set(db.collection("newspaperLocations").doc(`${paper}_${loc}`),
        { newspaperId: paper, locationId: loc, active: true }, { merge: true });

    batch.set(db.collection("publicationSchedules").doc(paper), SCHEDULE, { merge: true });

    for (const f of FORMATS_OFFERED) {
      const r = RATES[f];
      batch.set(db.collection("pricingRules").doc(`${paper}_${f}_test`), {
        newspaperId: paper, formatId: f, ...r,
        effectiveFrom: today, effectiveTo: null, active: true,
      }, { merge: true });
    }
  }

  CATEGORY_IDS.forEach((c) => batch.set(db.collection("categories").doc(c), { active: true }, { merge: true }));
  FORMAT_IDS.forEach((f) => batch.set(db.collection("formats").doc(f), { active: true }, { merge: true }));

  await batch.commit();
  console.log("✓ Test catalog written (mappings, schedules, TEST pricing). Replace with real data before launch.");
}
main().catch((e) => { console.error(e.message); process.exit(1); });