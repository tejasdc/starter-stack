import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns health status", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.db.status).toBe("ok");
  });
});
