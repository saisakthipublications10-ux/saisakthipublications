import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

async function main() {
  console.log("Project:", process.env.FIREBASE_PROJECT_ID);
  const { users } = await getAuth().listUsers(50);
  if (!users.length) console.log("No users yet in this project.");
  for (const u of users)
    console.log("-", u.email, "| providers:", u.providerData.map((p) => p.providerId).join(", "), "| claims:", JSON.stringify(u.customClaims ?? {}));
}
main().catch((e) => { console.error(e.message); process.exit(1); });