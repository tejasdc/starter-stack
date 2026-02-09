# Starter Stack

Full-stack TypeScript starter with Hono + React + TanStack + Tailwind v4 + BullMQ + PWA. AI-ready with Claude Code skills, deploy to Render in one click.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-org/starter-stack)

## What's Included

| Layer | Technology | Why |
|-------|-----------|-----|
| API | [Hono](https://hono.dev) | Fast, type-safe, RPC client for end-to-end types |
| Database | [Drizzle ORM](https://orm.drizzle.team) + Postgres | Type-safe queries, zero runtime overhead |
| Frontend | React 19 + [TanStack Router](https://tanstack.com/router) + [Tailwind v4](https://tailwindcss.com) | File-based routing, CSS-first config |
| State | [TanStack Query](https://tanstack.com/query) | Server state management with smart caching |
| Background Jobs | [BullMQ](https://bullmq.io) + Redis | Reliable async processing with retries |
| AI | [Anthropic SDK](https://docs.anthropic.com) | Pre-installed, ready for Claude API calls |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Offline support, installable app |
| Testing | [Vitest](https://vitest.dev) + [Testcontainers](https://testcontainers.com) | Real Postgres in tests, no mocks |
| Build | [Turborepo](https://turbo.build) + [Biome](https://biomejs.dev) | Fast builds, fast linting |
| Deploy | [Render](https://render.com) | One-click deploy, managed infrastructure |
| AI Agent | [Claude Code](https://claude.ai/claude-code) | CLAUDE.md + 5 skills for guided development |

## Quick Start

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- [pnpm](https://pnpm.io) 9+
- [Docker](https://docker.com) (for local Postgres + Redis and tests)

### Let the Agent Do It

If you have [Claude Code](https://claude.ai/claude-code) installed, just say:

```
Set up the project — install deps, start docker, run migrations, seed the db, and start dev servers.
```

Claude Code will read the `CLAUDE.md` and skills to execute everything correctly.

### Manual Setup

```bash
# Install dependencies
pnpm install

# Start Postgres + Redis locally
docker compose up -d

# Copy environment variables
cp .env.example .env

# Generate and run database migrations
pnpm --filter @starter/api exec drizzle-kit generate
pnpm --filter @starter/api exec drizzle-kit migrate

# Seed the database (creates demo user + API key)
pnpm --filter @starter/api exec tsx scripts/seed.ts

# Start development servers
pnpm dev
```

The API runs on `http://localhost:3000`, the web app on `http://localhost:5173` (proxies `/api` to the API).

## Project Structure

```
starter-stack/
├── packages/
│   ├── api/                    # Hono API server + BullMQ worker
│   │   ├── src/
│   │   │   ├── db/schema/      # Drizzle table definitions
│   │   │   ├── jobs/           # BullMQ queue definitions + processors
│   │   │   ├── lib/            # Shared utilities (errors, logger, pagination)
│   │   │   ├── middleware/     # Auth middleware
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── app.ts          # Hono app + route mounting
│   │   │   ├── server.ts       # HTTP server entry point
│   │   │   └── worker.ts       # BullMQ worker entry point
│   │   ├── tests/              # Integration tests (Vitest + Testcontainers)
│   │   └── scripts/seed.ts     # Database seeder
│   ├── web/                    # React frontend with PWA
│   │   ├── src/
│   │   │   ├── routes/         # TanStack file-based routes
│   │   │   ├── lib/            # API client (Hono RPC)
│   │   │   └── components/     # UI components
│   │   └── vite.config.ts      # Vite + PWA + Tailwind v4
│   └── shared/                 # Shared types + Zod schemas
├── .claude/skills/             # Claude Code skills for guided development
├── CLAUDE.md                   # AI agent instructions
├── render.yaml                 # Render deployment blueprint
├── docker-compose.yml          # Local dev infrastructure
├── turbo.json                  # Turborepo build config
└── biome.json                  # Linter + formatter config
```

## Deploy to Render

### One-Click Deploy

Click the button above, or use the Render CLI:

```bash
render blueprint apply
```

### MCP Server for Claude Code

For AI-assisted deployment management, add the [Render MCP server](https://github.com/render-oss/render-mcp-server) to your Claude Code config:

**`~/.claude/settings.json`:**

```json
{
  "mcpServers": {
    "render": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-render"],
      "env": {
        "RENDER_API_KEY": "your-render-api-key"
      }
    }
  }
}
```

Then ask Claude Code:

```
Deploy this project to Render. Use the render.yaml blueprint.
```

### What Gets Deployed

| Service | Type | Purpose |
|---------|------|---------|
| api | Web Service | Hono API server |
| web | Static Site | React frontend (Vite build) |
| worker | Background Worker | BullMQ job processor |
| redis | Redis (Valkey) | Job queue backend |
| db | PostgreSQL | Primary database |

## Claude Code Skills

This project includes 5 skills that guide Claude Code to follow best practices:

| Skill | Type | Purpose |
|-------|------|---------|
| `hono-patterns` | Auto-loaded | Route structure, AppType, error handling, validation |
| `drizzle-patterns` | Auto-loaded | Schema defs, queries, transactions, error wrapping |
| `bullmq-patterns` | Auto-loaded | Queue setup, workers, retry config, testing |
| `/run-tests` | User-invocable | Full build + typecheck + test pipeline |
| `/pre-deploy` | User-invocable | Dangerous pattern scan + deployment checklist |

## Adding a New Feature

Example: Adding a "todos" resource.

1. **Schema**: Create `packages/api/src/db/schema/todos.ts`
2. **Relations**: Update `packages/api/src/db/schema/relations.ts`
3. **Export**: Add to `packages/api/src/db/schema/index.ts`
4. **Migration**: Run `pnpm --filter @starter/api exec drizzle-kit generate`
5. **Route**: Create `packages/api/src/routes/todos.ts`
6. **Mount**: Chain `.route("/api/todos", todoRoutes)` in `app.ts`
7. **Frontend**: Add route in `packages/web/src/routes/todos.tsx`
8. **Test**: Run `/run-tests`

## License

MIT
