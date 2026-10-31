import { readFileSync } from "node:fs";
import pg from "pg";
if (!["dev", "production"].includes(process.env.NEON_BRANCH))
  throw Error("Explicit Neon branch required");
const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});
await client.connect();
try {
  for (const item of [
    [
      "privacy",
      "privacy-legacy-2026-11-01.txt",
      "Privacy & permissions — previous development overview",
      "Previous public website overview",
    ],
    [
      "privacy",
      "privacy-2026-11-01.txt",
      "Sideby Privacy Policy",
      "Detailed permissions, data handling, contact and retention disclosures",
    ],
    [
      "terms",
      "terms-2026-11-01.txt",
      "Sideby Terms of Use",
      "Initial development service terms",
    ],
    [
      "support",
      "support-2026-11-01.txt",
      "Sideby Support Policy",
      "Private reports, support scope and retention",
    ],
  ]) {
    const [slug, file, title, summary] = item,
      body = readFileSync(
        new URL("../docs/policies/" + file, import.meta.url),
        "utf8",
      );
    await client.query("BEGIN");
    try {
      let found = await client.query(
        "SELECT id FROM sideby_policy_versions WHERE slug=$1 AND body=$2 AND published_at IS NOT NULL",
        [slug, body],
      );
      if (!found.rows.length) {
        found = await client.query(
          "INSERT INTO sideby_policy_versions(slug,title,body,summary,effective_date,published_at) VALUES($1,$2,$3,$4,$5,now()) RETURNING id",
          [slug, title, body, summary, "2026-11-01"],
        );
        await client.query(
          "INSERT INTO sideby_admin_audit(action,resource_id) VALUES($1,$2)",
          ["policy.initial_publish", found.rows[0].id],
        );
      }
      await client.query(
        "INSERT INTO sideby_policy_current(slug,version_id) VALUES($1,$2) ON CONFLICT(slug) DO UPDATE SET version_id=EXCLUDED.version_id",
        [slug, found.rows[0].id],
      );
      await client.query("COMMIT");
      console.log(
        "Published " + slug + " / " + title + " on " + process.env.NEON_BRANCH,
      );
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
} finally {
  await client.end();
}
