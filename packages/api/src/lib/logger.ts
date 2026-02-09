import pino from "pino";
import type { Job } from "bullmq";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined,
});

export function createJobLogger(job: Job) {
  return logger.child({ jobId: job.id ?? null, jobName: job.name });
}
