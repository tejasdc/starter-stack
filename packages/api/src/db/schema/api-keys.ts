import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("default"),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("api_keys_key_hash_idx").on(t.keyHash),
  index("api_keys_active_idx").on(t.keyHash, t.revokedAt),
]);
