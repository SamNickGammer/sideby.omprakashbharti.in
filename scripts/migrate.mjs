import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
const statements = readFileSync(
  new URL("../db/migrations/001_family.sql", import.meta.url),
  "utf8",
)
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
await sql.transaction(statements.map((s) => sql.query(s)));
console.log(
  "PASS migration 001: family, children, routines and indexes created.",
);
