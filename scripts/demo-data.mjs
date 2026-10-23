import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const [mode, email] = process.argv.slice(2);
if (!["seed", "clean"].includes(mode) || !email) {
  throw new Error(
    "Usage: node --env-file=.env.local scripts/demo-data.mjs seed|clean parent@example.com",
  );
}
const sql = neon(process.env.DATABASE_URL);
const [user] =
  await sql`SELECT id FROM neon_auth."user" WHERE lower(email)=lower(${email})`;
if (!user)
  throw new Error(
    "Create this parent account in Sideby first. No data was changed.",
  );
// Stable IDs let us repeat seeding and remove only this account's sample rows.
function id(label) {
  const h = createHash("sha256")
    .update(`sideby-demo-v1:${user.id}:${label}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const familyId = id("family");
const children = [
  { key: "maya", name: "Demo Maya", age: 12, color: "mint", minutes: 120 },
  { key: "arjun", name: "Demo Arjun", age: 9, color: "peach", minutes: 90 },
  { key: "zoe", name: "Demo Zoe", age: 15, color: "lavender", minutes: 180 },
];
const routines = [
  {
    key: "homework",
    name: "Demo · Homework",
    start: "17:00",
    end: "18:30",
    days: "weekdays",
  },
  {
    key: "bedtime",
    name: "Demo · Bedtime",
    start: "21:00",
    end: "07:00",
    days: "daily",
  },
  {
    key: "weekend",
    name: "Demo · Weekend quiet time",
    start: "14:00",
    end: "15:00",
    days: "weekends",
  },
];
const childIds = children.map((c) => id(c.key));
const routineIds = routines.map((r) => id(r.key));
if (mode === "seed") {
  await sql.transaction([
    sql`INSERT INTO sideby_families(id,owner_id,name) VALUES(${familyId},${user.id},'Demo family') ON CONFLICT(owner_id) DO NOTHING`,
    ...children.map(
      (c) =>
        sql`INSERT INTO sideby_children(id,family_id,name,age,color,daily_limit) SELECT ${id(c.key)},id,${c.name},${c.age},${c.color},${c.minutes} FROM sideby_families WHERE owner_id=${user.id} ON CONFLICT(id) DO NOTHING`,
    ),
    ...routines.map(
      (r) =>
        sql`INSERT INTO sideby_routines(id,family_id,name,start_time,end_time,days) SELECT ${id(r.key)},id,${r.name},${r.start},${r.end},${r.days} FROM sideby_families WHERE owner_id=${user.id} ON CONFLICT(id) DO NOTHING`,
    ),
    sql`UPDATE sideby_families SET revision=revision+1 WHERE owner_id=${user.id}`,
  ]);
  const [counts] =
    await sql`SELECT (SELECT count(*) FROM sideby_children c JOIN sideby_families f ON f.id=c.family_id WHERE f.owner_id=${user.id} AND c.id=ANY(${childIds}::uuid[])) children,(SELECT count(*) FROM sideby_routines r JOIN sideby_families f ON f.id=r.family_id WHERE f.owner_id=${user.id} AND r.id=ANY(${routineIds}::uuid[])) routines`;
  if (Number(counts.children) !== 3 || Number(counts.routines) !== 3)
    throw new Error("Sample verification failed");
  console.log(
    "PASS sample data ready: 3 children and 3 routines. Existing profiles and changes were preserved.",
  );
} else {
  const photos =
    await sql`SELECT c.avatar_key FROM sideby_children c JOIN sideby_families f ON f.id=c.family_id WHERE f.owner_id=${user.id} AND c.id=ANY(${childIds}::uuid[]) AND c.avatar_key IS NOT NULL`;
  const s3 = new S3Client({ forcePathStyle: true });
  for (const photo of photos)
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET || "assets",
        Key: photo.avatar_key,
      }),
    );
  await sql.transaction([
    sql`DELETE FROM sideby_children WHERE id=ANY(${childIds}::uuid[]) AND family_id IN (SELECT id FROM sideby_families WHERE owner_id=${user.id})`,
    sql`DELETE FROM sideby_routines WHERE id=ANY(${routineIds}::uuid[]) AND family_id IN (SELECT id FROM sideby_families WHERE owner_id=${user.id})`,
    sql`UPDATE sideby_families SET revision=revision+1 WHERE owner_id=${user.id}`,
    sql`DELETE FROM sideby_families WHERE id=${familyId} AND owner_id=${user.id} AND NOT EXISTS(SELECT 1 FROM sideby_children WHERE family_id=${familyId}) AND NOT EXISTS(SELECT 1 FROM sideby_routines WHERE family_id=${familyId})`,
  ]);
  console.log(
    "PASS sample profiles, routines and their photos removed. Parent login and non-sample data preserved.",
  );
}
