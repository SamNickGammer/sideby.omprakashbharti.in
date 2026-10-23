import { readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
const ids = JSON.parse(readFileSync(".test-users.json", "utf8"));
const sql = neon(process.env.DATABASE_URL);
const s3 = new S3Client({ forcePathStyle: true });
let count = 0;
for (const id of ids) {
  const [user] =
    await sql`SELECT id,email,name FROM neon_auth."user" WHERE id=${id}`;
  if (!user) continue;
  if (
    !/^sideby-test-[0-9a-f]{8}-[ab]@example.com$/.test(user.email) ||
    !["Sideby Test a", "Sideby Test b"].includes(user.name)
  )
    throw new Error("Refusing to remove a non-test account");
  const photos =
    await sql`SELECT c.avatar_key FROM sideby_children c JOIN sideby_families f ON f.id=c.family_id WHERE f.owner_id=${id} AND c.avatar_key IS NOT NULL`;
  for (const p of photos)
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET || "assets",
        Key: p.avatar_key,
      }),
    );
  // Use the provider's user deletion endpoint rather than editing managed auth tables.
  execFileSync("neon", ["neon-auth", "user", "delete", id], { stdio: "pipe" });
  await sql`DELETE FROM sideby_families WHERE owner_id=${id}`;
  count++;
}
for (const name of [".test-users.json", ".test-session.json", ".test-pairing.json"])
  rmSync(name, { force: true });
console.log(
  `PASS removed ${count} synthetic test accounts, their family data and profile uploads`,
);
