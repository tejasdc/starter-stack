import type { Job } from "bullmq";
import type { ExampleJob } from "./queue.js";
import { createJobLogger } from "../lib/logger.js";

export async function exampleProcessor(job: Job<ExampleJob>) {
  const log = createJobLogger(job);
  log.info({ data: job.data }, "Processing example job");

  // Your job processing logic here.
  // For AI tasks, call the Anthropic SDK.
  // For data processing, query the database.

  log.info("Example job completed");
}
