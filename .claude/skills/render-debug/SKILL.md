---
name: render-debug
description: "Debug production issues on Render. Launches a subagent that checks service health, reads logs, analyzes errors, and returns a diagnostic summary — all without consuming the main context window."
user_invocable: true
---

# Render Production Debugger

When this skill is invoked, launch a `general-purpose` subagent via the Task tool with the prompt below. The subagent runs in its own context window and returns a crisp summary.

**NEVER debug production issues in the main context window.** Always use this skill or a subagent.

## How to Use

1. Take the user's issue description (or default to "general health check")
2. Launch a `general-purpose` subagent with the **Debug Agent Prompt** below, inserting the user's issue
3. When the subagent returns, relay its findings to the user

## Debug Agent Prompt

Copy this entire prompt into the Task tool, replacing `{{ISSUE}}` with the user's description and `{{SERVICE_PREFIX}}` with the project's service prefix (default: `starter`):

---

You are debugging a production issue on Render.

**Issue to investigate**: {{ISSUE}}

## System Architecture

```
[Browser] → {{SERVICE_PREFIX}}-web (static site, Vite/React)
    ↓
[API Calls] → {{SERVICE_PREFIX}}-api (Hono, Node.js)
    ↓                    ↓
{{SERVICE_PREFIX}}-db    {{SERVICE_PREFIX}}-redis (Valkey/Redis)
(PostgreSQL)                 ↓
                    {{SERVICE_PREFIX}}-worker (BullMQ, Node.js)
```

### Common Failures
- Redis connection errors → jobs not processed
- Missing env vars → service crashes on startup
- Database connection pool exhaustion → 503 errors
- Worker crash loop → jobs stuck in queue

## Investigation Steps

**IMPORTANT: Use ToolSearch to load Render MCP tools before calling them.**

1. `ToolSearch("render list services")` → load mcp__render__list_services → get service IDs
2. `ToolSearch("render list logs")` → load mcp__render__list_logs
3. Check worker logs: `{ resource: [workerServiceId], type: ["app"], level: ["error", "warn"], limit: 50, direction: "backward" }`
4. Check api logs: `{ resource: [apiServiceId], type: ["app"], level: ["error", "warn"], limit: 50, direction: "backward" }`
5. Check recent deploys: `ToolSearch("render list deploys")` → `mcp__render__list_deploys({ serviceId, limit: 3 })`
6. If needed, check metrics: `ToolSearch("render get metrics")` → CPU/memory/latency

## Output Format

```
## Render Debug Report

**Issue**: [what was investigated]
**Status**: 🟢 Healthy | 🟡 Degraded | 🔴 Down

### Services
| Service | Status | Notes |
|---------|--------|-------|
| api | 🟢/🟡/🔴 | ... |
| worker | 🟢/🟡/🔴 | ... |

### Root Cause
[What's wrong, with log evidence]

### Key Logs
[2-3 most relevant log lines]

### Recommendation
[Specific fix actions]
```

Be concise. Only return actionable information.

---
