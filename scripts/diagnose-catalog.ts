import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore();

async function main() {
  const [locs, papers, maps] = await Promise.all([
    db.collection("locations").get(),
    db.collection("newspapers").get(),
    db.collection("newspaperLocations").get(),
  ]);
  const mapById = new Map(maps.docs.map((d) => [d.id, d.data()]));

  console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`Locations: ${locs.size} | Newspapers: ${papers.size} | Mappings: ${maps.size}\n`);

  for (const l of locs.docs) {
    console.log(`📍 ${l.data().name} (id: ${l.id}) active=${l.data().active}`);
    for (const p of papers.docs) {
      const m = mapById.get(`${p.id}_${l.id}`);
      const problems: string[] = [];
      if (!p.data().active) problems.push("newspaper is not active");
      if (!m) problems.push(`no mapping doc "${p.id}_${l.id}"`);
      else if (!m.active) problems.push("mapping exists but active=false");
      console.log(`   ${problems.length ? "✗" : "✓"} ${p.data().name}${problems.length ? " → " + problems.join("; ") : ""}`);
    }
  }

  const known = new Set(locs.docs.map((d) => d.id));
  const stray = maps.docs.filter((d) => !known.has(d.data().locationId));
  if (stray.length)
    console.log("\n⚠ Mappings pointing at unknown locations:", stray.map((d) => `${d.id} → ${d.data().locationId}`).join(", "));
}
main().catch((e) => { console.error(e.message); process.exit(1); });