import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema } from "@starter/shared";

import type { AppEnv } from "../types/env.js";
import { registerUser, generateApiKey } from "../services/auth.js";
import { db } from "../db/index.js";
import { apiKeys } from "../db/schema/index.js";
import { eq, isNull } from "drizzle-orm";

export const authRoutes = new Hono<AppEnv>()
  .post(
    "/register",
    zValidator("json", registerSchema, (result) => {
      if (!result.success) throw result.error;
    }),
    async (c) => {
      const input = c.req.valid("json");
      const result = await registerUser(input);
      return c.json(
        { user: { id: result.user.id, name: result.user.name, email: result.user.email }, apiKey: result.apiKey },
        201,
      );
    },
  )
  .get("/me", async (c) => {
    const user = c.get("user");
    return c.json({ id: user.id, name: user.name, email: user.email });
  })
  .get("/api-keys", async (c) => {
    const user = c.get("user");
    const keys = await db.query.apiKeys.findMany({
      where: (t, { eq, isNull, and }) => and(eq(t.userId, user.id), isNull(t.revokedAt)),
      columns: { id: true, label: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    });
    return c.json(keys);
  })
  .post("/api-keys/:id/revoke", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const [key] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning();
    if (!key || key.userId !== user.id) return c.json({ error: "Not found" }, 404);
    return c.json({ id: key.id, revokedAt: key.revokedAt });
  });
