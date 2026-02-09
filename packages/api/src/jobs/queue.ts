import { Queue } from "bullmq";
import IORedis from "ioredis";

import { logger } from "../lib/logger.js";

export type ExampleJob = { message: string };

let redis: IORedis | null = null;

export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

export function getRedisConnection(): IORedis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redis = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  return redis;
}

export function getRedisConnectionOrThrow(): IORedis {
  const conn = getRedisConnection();
  if (!conn) throw new Error("REDIS_URL is required for the worker process");
  return conn;
}

function lazyQueue<T>(name: string): Queue<T> | null {
  const conn = getRedisConnection();
  if (!conn) {
    logger.warn({ queue: name }, "Queue unavailable — REDIS_URL not set");
    return null;
  }
  return new Queue<T>(name, { connection: conn });
}

let _example: Queue<ExampleJob> | null | undefined;

export function getExampleQueue() {
  if (_example === undefined) _example = lazyQueue("example-jobs");
  return _example;
}

export const DEFAULT_JOB_OPTS = {
  removeOnComplete: true,
  removeOnFail: 500,
} as const;
