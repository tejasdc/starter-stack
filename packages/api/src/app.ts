import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql as dsql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { AppEnv } from "./types/env.js";
import { db } from "./db/index.js";
import { toErrorResponse } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function withTimeout<T>(p: Promise<T>, ms: number) {
  let t: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        t = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

async function checkDb() {
  const started = Date.now();
  try {
    await withTimeout(db.execute(dsql`select 1`), 5000);
    return { status: "ok" as const, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      status: "fail" as const,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function createApp() {
  const base = new Hono<AppEnv>();

  base.onError((err, c) => toErrorResponse(c, err));

  base.use(
    "/api/*",
    cors({
      origin: parseCorsOrigins(),
      credentials: false,
      maxAge: 60 * 60 * 24,
    }),
  );

  // Request ID + structured logging.
  base.use("/api/*", async (c, next) => {
    const requestId = randomUUID();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);

    const started = Date.now();
    try {
      await next();
    } finally {
      const userId = (() => {
        try {
          return c.get("user")?.id as string | undefined;
        } catch {
          return undefined;
        }
      })();

      logger.info(
        {
          requestId,
          userId,
          method: c.req.method,
          url: c.req.url,
          statusCode: c.res.status,
          responseTime: Date.now() - started,
        },
        "request",
      );
    }
  });

  // Health check (public).
  const withHealth = base.get("/api/health", async (c) => {
    const dbRes = await checkDb();
    const status = dbRes.status === "ok" ? "ok" : "unhealthy";
    return c.json(
      { status, timestamp: new Date().toISOString(), checks: { db: dbRes } },
      dbRes.status === "ok" ? 200 : 503,
    );
  });

  // Auth middleware for all other API routes.
  withHealth.use("/api/*", authMiddleware);

  // Mount routes — chain .route() calls to preserve AppType inference.
  const withRoutes = withHealth
    .route("/api/auth", authRoutes)
    // Add your routes here:
    // .route("/api/items", itemRoutes)
    .get("/", (c) => c.json({ status: "ok" }));

  withRoutes.notFound((c) =>
    c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Not found",
          status: 404,
          requestId: c.get("requestId"),
        },
      },
      404,
    ),
  );

  return withRoutes;
}

export const app = createApp();
export type AppType = typeof app;
