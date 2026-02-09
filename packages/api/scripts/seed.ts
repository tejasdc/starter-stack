import { db } from "../src/db/index.js";
import { users, apiKeys } from "../src/db/schema/index.js";
import { generateApiKey } from "../src/services/auth.js";

async function seed() {
  console.log("Seeding database...");

  // Create a demo user.
  const [user] = await db
    .insert(users)
    .values({ name: "Demo User", email: "demo@example.com" })
    .onConflictDoNothing()
    .returning();

  if (user) {
    const key = generateApiKey();
    await db
      .insert(apiKeys)
      .values({ userId: user.id, keyHash: key.hash, keyPrefix: key.prefix, label: "seed-key" })
      .onConflictDoNothing();

    console.log(`Created user: ${user.email}`);
    console.log(`API key: ${key.plaintext}`);
    console.log("Save this key — it won't be shown again.");
  } else {
    console.log("Demo user already exists, skipping.");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
