import { beforeEach } from "vitest";
import { sql as dsql } from "drizzle-orm";

beforeEach(async () => {
  const { db } = await import("../src/db/index.js");
  await db.execute(
    dsql`truncate table api_keys, users cascade`,
  );
});
