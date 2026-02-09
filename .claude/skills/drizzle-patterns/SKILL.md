---
name: drizzle-patterns
description: "Drizzle ORM patterns for this project. Use when writing schemas, queries, transactions, migrations, or error handling against Postgres. Ensures consistency and avoids known pitfalls."
user_invocable: false
---

# Drizzle ORM Patterns

Reference guide for writing Drizzle code in this project.

## Schema Definitions

### Tables live in `packages/api/src/db/schema/`

Each table gets its own file. Use `pgTable` with index callback:

```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const myTable = pgTable("my_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("my_table_name_idx").on(t.name),
]);
```

### Relations go in `packages/api/src/db/schema/relations.ts`

```typescript
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
}));
```

### Foreign keys use explicit cascade rules

- Parent owns children: `onDelete: "cascade"`
- Optional references: `onDelete: "set null"`

## Query Patterns

### Simple lookup — use `db.query` API

```typescript
const user = await db.query.users.findFirst({
  where: (t, { eq }) => eq(t.id, userId),
});
```

### Insert with returning

```typescript
const [row] = await db.insert(users).values(input).returning();
```

### Update with where

```typescript
const [updated] = await db
  .update(users)
  .set({ ...patch, updatedAt: new Date() })
  .where(eq(users.id, id))
  .returning();
```

## Transactions

### Use `db.transaction()` for multi-statement operations

```typescript
return db.transaction(async (tx) => {
  const [row] = await tx.update(users).set({ name }).where(eq(users.id, id)).returning();
  await tx.insert(auditLog).values({ userId: id, action: "name_change" });
  return row!;
});
```

**Use `tx` (not `db`) inside transactions.** Using `db` executes outside the transaction boundary.

## Conflict Handling

### Use `.onConflictDoNothing()` for idempotent inserts

Critical for BullMQ retry safety — jobs may run more than once:

```typescript
await tx.insert(tags).values({ name: tagName }).onConflictDoNothing();
```

## Error Handling — CRITICAL

### Drizzle v0.45 wraps Postgres errors

**NEVER check `err.code` directly. ALWAYS check `err.cause.code`.**

```typescript
// WRONG
if (err.code === '23505') { ... }

// CORRECT — use the helper from lib/errors.ts
import { isUniqueViolation } from "../lib/errors.js";

if (isUniqueViolation(err)) { ... }
```

### Common Postgres error codes

| Code | Meaning | Drizzle Access |
|------|---------|----------------|
| 23505 | Unique violation | `err.cause?.code === '23505'` |
| 23503 | Foreign key violation | `err.cause?.code === '23503'` |
| 23502 | Not-null violation | `err.cause?.code === '23502'` |

## Migrations

Generate migrations with:

```bash
pnpm --filter @starter/api exec drizzle-kit generate
```

Migration safety rules:
- Migrations must be additive (no DROP COLUMN/TABLE without discussion)
- New columns must have defaults or be nullable
- Index creation on large tables: use `CREATE INDEX CONCURRENTLY`

## Checklist for New Database Code

- [ ] Table definition in `packages/api/src/db/schema/` with proper types and indexes
- [ ] Relations defined in `relations.ts`
- [ ] Schema exported from `packages/api/src/db/schema/index.ts`
- [ ] Queries use `tx` inside transactions, not `db`
- [ ] Idempotent inserts use `.onConflictDoNothing()`
- [ ] Error handling checks `err.cause.code` (not `err.code`)
- [ ] New columns have defaults or are nullable
- [ ] Migration generated and reviewed

## Context7 Documentation

For up-to-date Drizzle API reference, use Context7 MCP:
1. `resolve-library-id` with query "drizzle orm"
2. `query-docs` with the resolved ID and your specific question
