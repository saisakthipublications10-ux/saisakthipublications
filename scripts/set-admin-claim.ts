import { config } from "dotenv";
config({ path: ".env.local" });
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
  }),
});

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npx tsx scripts/set-admin-claim.ts email [password]");
  const auth = getAuth();

  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    if (!password || password.length < 8)
      throw new Error("That email has no account yet. Pass a password (8+ characters) to create it.");
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Created account for ${email}`);
  }

  await auth.setCustomUserClaims(user.uid, { role: "admin" });
  await auth.revokeRefreshTokens(user.uid); // forces a fresh sign-in so the claim applies
  console.log(`✓ ${email} is now an admin. Sign in again to activate it.`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });