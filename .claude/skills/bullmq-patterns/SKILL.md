---
name: bullmq-patterns
description: "BullMQ job queue patterns for this project. Use when writing new queues, workers, job processors, or modifying the async pipeline. Ensures consistency and avoids known pitfalls."
user_invocable: false
---

# BullMQ Job Queue Patterns

Reference guide for writing BullMQ code in this project.

## Architecture

```
API Server (packages/api)                Worker Process (packages/api/src/worker.ts)
+-----------------------+                +----------------------------+
| Route handler          |                | Worker("example-jobs")     |
|   -> service           |                | Worker("my-queue")         |
|     -> queue.add()  ---+---- Redis ---> |                            |
+-----------------------+                +----------------------------+
```

- Queues defined in `packages/api/src/jobs/queue.ts`
- Processors in `packages/api/src/jobs/*.ts`
- Worker startup in `packages/api/src/worker.ts`

## Queue Definitions

### All queues in `packages/api/src/jobs/queue.ts`

```typescript
// Queue names — ALWAYS use hyphens, NEVER colons
const myQueue = lazyQueue<MyJob>("my-queue");
```

### Lazy queue pattern for Redis-optional API

The API server works without Redis (queues return `null`):

```typescript
const queue = getExampleQueue();
if (!queue) {
  logger.warn("Redis unavailable — job not queued");
  return;
}
await queue.add("example-jobs", data, { ...DEFAULT_JOB_OPTS });
```

## Connection Configuration

```typescript
const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,  // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});
```

**`maxRetriesPerRequest: null`** is mandatory — BullMQ requires this.

### Redis/Valkey eviction policy

**MUST be `noeviction`** — if keys are evicted, BullMQ loses job data silently.

## Adding Jobs

```typescript
await queue.add("job-name", jobData, {
  ...DEFAULT_JOB_OPTS,
  jobId: deduplicationKey,
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
});
```

## Processor Functions

```typescript
import type { Job } from "bullmq";

export async function myProcessor(job: Job<MyJobData>) {
  const log = createJobLogger(job);
  log.info({ data: job.data }, "Processing job");
  // ... processing logic
}
```

## Graceful Shutdown

```typescript
async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  await Promise.allSettled(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
```

## Testing

### Mock queues in tests

```typescript
vi.mock("../src/jobs/queue.js", () => ({
  getExampleQueue: () => ({ add: vi.fn().mockResolvedValue(undefined) }),
  DEFAULT_JOB_OPTS: { removeOnComplete: true, removeOnFail: 500 },
  isRedisConfigured: () => false,
  getRedisConnection: () => null,
}));
```

## Checklist for New Queues/Workers

- [ ] Queue name uses hyphens, never colons
- [ ] Job data type defined in `queue.ts`
- [ ] Lazy queue getter exported from `queue.ts`
- [ ] Processor function in `packages/api/src/jobs/`
- [ ] Worker registered in `worker.ts` with `wire()` call
- [ ] Job addition includes `DEFAULT_JOB_OPTS`, retry config
- [ ] Database inserts inside processor use `.onConflictDoNothing()` for retry safety
- [ ] Queue getter returns `null` check at call site

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Queue name with colons | Redis key structure breaks | Use hyphens: `my-queue` |
| Missing `maxRetriesPerRequest: null` | `MaxRetriesPerRequestError` | Set in connection config |
| Redis `maxmemory-policy` not `noeviction` | Job data silently evicted | Configure in Redis/Valkey |
| Missing `onConflictDoNothing()` in processor | Duplicate rows on retry | Add to all inserts |
| Not checking queue getter for `null` | Crash when Redis unavailable | Guard with `if (!queue)` |

## Context7 Documentation

For up-to-date BullMQ API reference, use Context7 MCP:
1. `resolve-library-id` with query "bullmq"
2. `query-docs` with the resolved ID and your specific question
