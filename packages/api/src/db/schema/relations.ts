import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { apiKeys } from "./api-keys.js";

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));
