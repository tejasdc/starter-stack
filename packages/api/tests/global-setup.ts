import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();

  const { db } = await import("../src/db/index.js");
  const migrationsFolder = path.resolve(fileURLToPath(new URL("../drizzle", import.meta.url)));
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (fs.existsSync(journalPath)) {
    await migrate(db as any, { migrationsFolder });
  }

  return async () => {
    try {
      const { pool } = await import("../src/db/index.js");
      await pool.end();
    } catch {
      // ignore
    }
    try {
      await container.stop();
    } catch {
      // ignore
    }
  };
}
