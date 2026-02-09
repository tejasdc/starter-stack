import { randomBytes, createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db/index.js";
import { apiKeys, users } from "../db/schema/index.js";
import { conflict } from "../lib/errors.js";
import { isUniqueViolation } from "../lib/errors.js";

function hashKey(plaintext: string) {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function generateApiKey() {
  const raw = randomBytes(32).toString("base64url");
  const prefix = raw.slice(0, 8);
  return { plaintext: `sk_${raw}`, prefix: `sk_${prefix}`, hash: hashKey(`sk_${raw}`) };
}

export async function validateApiKey(plaintext: string) {
  const hash = hashKey(plaintext);
  const row = await db.query.apiKeys.findFirst({
    where: (t, { and, eq, isNull }) => and(eq(t.keyHash, hash), isNull(t.revokedAt)),
    with: { user: true },
  });
  if (!row) return null;
  return { apiKey: row, user: row.user };
}

export async function registerUser(input: { name: string; email: string }) {
  let user: typeof users.$inferSelect;
  try {
    const [row] = await db.insert(users).values(input).returning();
    user = row!;
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("Email already registered");
    throw err;
  }

  const key = generateApiKey();
  await db.insert(apiKeys).values({ userId: user.id, keyHash: key.hash, keyPrefix: key.prefix });

  return { user, apiKey: key.plaintext };
}
