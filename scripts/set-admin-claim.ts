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
  const [email, password] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npx tsx scripts/set-admin-claim.ts you@example.com [password-if-creating]");
  const auth = getAuth();

  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    if (!password || password.length < 8)
      throw new Error("No such user. Pass a password of 8+ characters as the second argument to create one.");
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Created ${email}`);
  }

  await auth.setCustomUserClaims(user.uid, { role: "admin" });
  await auth.revokeRefreshTokens(user.uid);
  console.log(`✓ ${email} is now an admin. Sign in again to activate it.`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });