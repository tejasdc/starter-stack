import type { MiddlewareHandler } from "hono";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db/index.js";
import { apiKeys } from "../db/schema/index.js";
import { unauthorized } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { validateApiKey } from "../services/auth.js";

const PUBLIC_PATHS = new Set(["/api/health", "/api/auth/register"]);

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  if (PUBLIC_PATHS.has(c.req.path)) {
    await next();
    return;
  }

  const authHeader = c.req.header("authorization");
  if (!authHeader) throw unauthorized("Missing Authorization header");

  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw unauthorized("Invalid Authorization header format");

  const plaintextKey = m[1]!.trim();
  const validated = await validateApiKey(plaintextKey);
  if (!validated) throw unauthorized("Invalid API key");

  c.set("user" as any, validated.user);
  c.set("apiKey" as any, validated.apiKey);

  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(apiKeys.id, validated.apiKey.id), isNull(apiKeys.revokedAt)))
    .catch((err) => logger.warn({ err }, "Failed to update api_keys.last_used_at"));

  await next();
};
