import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
const dir = new URL("../db/migrations/", import.meta.url);
for (const file of readdirSync(dir)
  .filter((f) => /^\d+_.*\.sql$/.test(f))
  .sort()) {
  const statements = readFileSync(new URL(file, dir), "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((s) => sql.query(s)));
  console.log(`PASS migration ${file}`);
}
