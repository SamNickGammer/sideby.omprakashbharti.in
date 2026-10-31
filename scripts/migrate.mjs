import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";
// Execute complete SQL files: splitting on semicolons corrupts PostgreSQL function bodies.
const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});
await client.connect();
try {
  const dir = new URL("../db/migrations/", import.meta.url);
  for (const file of readdirSync(dir)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort()) {
    await client.query("BEGIN");
    try {
      await client.query(readFileSync(new URL(file, dir), "utf8"));
      await client.query("COMMIT");
      console.log(`PASS migration ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
} finally {
  await client.end();
}
