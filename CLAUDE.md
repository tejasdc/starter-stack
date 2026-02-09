# Starter Stack — Project Instructions

## Tech Stack
- **API**: Hono + Drizzle + Postgres (packages/api)
- **Web**: Vite + React + TanStack Router/Query + Tailwind v4 + PWA (packages/web)
- **Shared**: Shared types, schemas, constants (packages/shared)
- **Worker**: BullMQ background jobs (packages/api/src/worker.ts)
- **Infra**: Render (see render.yaml)

## Build & Test
```
pnpm turbo build                         # Build all packages
pnpm --filter @starter/shared build      # Build shared first
pnpm --filter @starter/api build         # Build API
pnpm --filter @starter/web build         # Build web
pnpm --filter @starter/api test          # Run API tests (Docker required)
```

## Key Patterns

### API Routes
- Chain `.route()` calls in `app.ts` — required for `AppType` inference and Hono RPC client
- Use `zValidator` for input validation with throw pattern
- Use `AppError` helpers (`badRequest`, `notFound`, `conflict`, etc.) — never raw status codes
- Public paths: `/api/health`, `/api/auth/register`. Everything else requires Bearer token.

### Database
- Queue names use hyphens, never colons: `example-jobs`, `my-queue`
- Drizzle v0.45 wraps Postgres errors: check `err.cause.code` not just `err.code` for unique violations
- Use `isUniqueViolation()` helper from `lib/errors.ts`
- Idempotent inserts (especially in job processors) use `.onConflictDoNothing()`
- Use `tx` (not `db`) inside `db.transaction()` callbacks

### AI Integration
- Anthropic SDK is pre-installed in `@starter/api`
- Use Zod v4 native `z.toJSONSchema()` for schema generation — do NOT use `zod-to-json-schema` (incompatible with Zod v4)
- Put AI calls in BullMQ job processors for async execution

### Background Jobs
- Redis is optional for the API server (degrades gracefully) but required for the worker
- Redis/Valkey must use `maxmemory-policy noeviction` to prevent BullMQ job data loss
- Connection requires `maxRetriesPerRequest: null` for BullMQ compatibility

### Frontend
- TanStack Router: `projects.tsx` = layout route; `projects.index.tsx` = index route
- PWA is configured via `vite-plugin-pwa` in `vite.config.ts`
- API client uses Hono RPC (`hc<AppType>`) for end-to-end type safety

## Library Rules
- **NEVER** import `zod-to-json-schema` — use `z.toJSONSchema()` instead (Zod v4 native)
- **NEVER** use colons in BullMQ queue names — use hyphens
- **NEVER** create `/admin/`, `/debug/`, `/temp/`, or `/cleanup` route paths

## Stack Pattern Skills (auto-loaded)
- `hono-patterns` — Route structure, AppType exports, error handling, validation, middleware
- `drizzle-patterns` — Schema defs, query patterns, transactions, conflict handling, error wrapping
- `bullmq-patterns` — Queue setup, workers, retry config, graceful shutdown, testing mocks
- Context7 MCP available for up-to-date docs on Hono, Drizzle, BullMQ, TanStack, and Zod

## Testing
- Tests use Vitest + Testcontainers (Docker required)
- `fileParallelism: false` — tests share a single Postgres container
- Redis is mocked in tests via `vi.mock`
- DB is truncated between tests in `tests/setup.ts`
- Node 22+ required (see `.nvmrc`)

## Debugging Production Issues

**NEVER debug production issues in the main context window.** Always use the `/render-debug` skill or launch a `general-purpose` subagent.

Why: Production debugging involves fetching logs, checking deployments, and analyzing metrics — all of which consume significant context. The subagent runs in its own context window and returns only a crisp summary.

### Architecture for debugging context:
```
Browser → web (static) → api (Hono) → db (Postgres)
                                     → redis (Valkey) → worker (BullMQ)
```

### Render MCP Server

For AI-assisted deployment management, the [Render MCP server](https://github.com/render-oss/render-mcp-server) should be configured. See README.md for setup instructions.

## Deployment
- `render.yaml` defines the full infrastructure blueprint
- Run `/pre-deploy` before pushing to main
- Build order: shared → api + web (Turborepo handles this)
