import { Worker } from "bullmq";

import { createJobLogger, logger } from "./lib/logger.js";
import { getRedisConnectionOrThrow } from "./jobs/queue.js";
import { exampleProcessor } from "./jobs/example-processor.js";

const connection = getRedisConnectionOrThrow();

function wire(worker: Worker) {
  worker.on("completed", (job) => {
    createJobLogger(job).info({ queue: worker.name }, "job completed");
  });
  worker.on("failed", (job, err) => {
    if (job) createJobLogger(job).error({ queue: worker.name, err }, "job failed");
    else logger.error({ queue: worker.name, err }, "job failed");
  });
  worker.on("error", (err) => {
    logger.error({ err, queue: worker.name }, "worker error");
  });
}

function getConcurrency(defaultValue: number) {
  const raw = process.env.BULLMQ_CONCURRENCY;
  if (!raw) return defaultValue;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return defaultValue;
  return Math.floor(n);
}

const workers = [
  new Worker("example-jobs", exampleProcessor, { connection, concurrency: getConcurrency(5) }),
  // Add your workers here:
  // new Worker("my-queue", myProcessor, { connection, concurrency: getConcurrency(5) }),
];

for (const w of workers) wire(w);

logger.info({ queues: workers.map((w) => w.name) }, "worker started");

async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  await Promise.allSettled(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
