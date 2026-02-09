---
name: hono-patterns
description: "Hono API patterns for this project. Use when writing new routes, middleware, error handling, or RPC client code. Ensures consistency with existing patterns."
user_invocable: false
---

# Hono API Patterns

Reference guide for writing Hono code in this project.

## Route Structure

### Route files live in `packages/api/src/routes/`

Each route file creates a sub-Hono instance and exports it:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../types/env.js";

export const myRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    // handler
  })
  .post("/", zValidator("json", createSchema, (result) => {
    if (!result.success) throw result.error;
  }), async (c) => {
    const input = c.req.valid("json");
    // handler
  });
```

### Route mounting in `packages/api/src/app.ts`

Routes are **chained** via `.route()` — critical for type inference:

```typescript
const withRoutes = withHealth
  .route("/api/auth", authRoutes)
  .route("/api/items", itemRoutes)
  .get("/", (c) => c.json({ status: "ok" }));
```

**Why chaining matters:** The `AppType` export captures all route signatures. If routes are registered separately, the Hono RPC client (`hc<AppType>`) on the frontend won't see them.

### AppType export for RPC client

```typescript
// packages/api/src/app.ts
export const app = createApp();
export type AppType = typeof app;
```

Used in `packages/web/src/lib/api-client.ts`:

```typescript
import { hc } from "hono/client";
import type { AppType } from "@starter/api";

const api = hc<AppType>(API_BASE_URL, {
  headers: () => {
    const k = getApiKey();
    return k ? { authorization: `Bearer ${k}` } : {};
  },
});
```

## Error Handling

### Use AppError helpers, never raw status codes

```typescript
import { badRequest, notFound, conflict, unauthorized } from "../lib/errors.js";

throw notFound("Entity not found");
throw conflict("Email already registered");

// WRONG — bypasses global error handler
return c.json({ error: "not found" }, 404);
```

Available helpers (see `packages/api/src/lib/errors.ts`):
- `badRequest(msg, details?)` — 400
- `unauthorized(msg?)` — 401
- `notFound(msg?)` — 404
- `conflict(msg?)` — 409
- `validationError(msg, details?)` — 422
- `rateLimited(msg?)` — 429
- `internalError(msg?)` — 500
- `serviceUnavailable(msg?)` — 503

## Validation

### Always use zValidator with throw pattern

```typescript
.post("/", zValidator("json", mySchema, (result) => {
  if (!result.success) throw result.error;
}), async (c) => {
  const input = c.req.valid("json");
})
```

Validator targets: `"json"` (body), `"param"` (path), `"query"` (querystring).

## Middleware

### Auth middleware is applied globally after health check

Public routes (no auth): `/api/health`, `/api/auth/register`

### Accessing auth context

```typescript
const user = c.get("user");     // { id, name, email }
const apiKey = c.get("apiKey"); // { id, userId, ... }
```

## Checklist for New Routes

- [ ] Create route file in `packages/api/src/routes/`
- [ ] Use `new Hono<AppEnv>()` with proper typing
- [ ] Chain `.route()` in `app.ts` (don't register separately)
- [ ] Use `zValidator` for input validation
- [ ] Use `AppError` helpers for errors, not raw status codes
- [ ] No `/admin/`, `/debug/`, `/temp/`, or `/cleanup` paths

## Context7 Documentation

For up-to-date Hono API reference, use Context7 MCP:
1. `resolve-library-id` with query "hono"
2. `query-docs` with the resolved ID and your specific question
