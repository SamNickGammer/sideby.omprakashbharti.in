import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
if (process.env.NEON_BRANCH !== "dev")
  throw Error("Admin verification requires Neon dev");
const db = neon(process.env.DATABASE_URL),
  base = "http://127.0.0.1:3006",
  web = "http://127.0.0.1:3011",
  credentials = JSON.parse(readFileSync(".test-admin.json", "utf8"));
let cookie = "",
  checks = 0;
async function req(path, method = "GET", data, opts = {}) {
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: opts.origin || base,
      "Content-Type": "application/json",
      Cookie: opts.cookie === undefined ? cookie : opts.cookie,
      ...opts.headers,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    redirect: "manual",
  });
  if (opts.capture) {
    cookie = r.headers.get("set-cookie")?.split(";")[0] || "";
  }
  return r;
}
function status(r, n) {
  assert.equal(r.status, n);
  checks++;
}
await db`DELETE FROM sideby_admin_limits`;
for (const p of ["/api/overview", "/api/policies", "/api/bugs"])
  status(await req(p), 401);
status(
  await req("/api/login", "POST", credentials, {
    origin: "https://evil.example",
  }),
  403,
);
status(
  await req("/api/login", "POST", {
    ...credentials,
    password: "wrong-password",
  }),
  401,
);
let r = await req("/api/login", "POST", credentials, { capture: true });
status(r, 200);
assert.match(r.headers.get("set-cookie"), /HttpOnly/i);
assert.match(r.headers.get("set-cookie"), /SameSite=strict/i);
checks += 2;
status(await req("/api/overview"), 200);
const overview = await (await req("/api/overview")).json();
assert.equal(overview.environment, "dev");
assert.equal(overview.available, true);
assert.equal(overview.growth.length, 30);
checks += 3;
status(
  await req("/api/overview", "GET", undefined, {
    cookie: "sideby_admin=forged",
  }),
  401,
);
status(
  await req("/api/policies", "POST", {}, { origin: "https://evil.example" }),
  403,
);
status(await req("/api/policies", "POST", {}), 400);
const draft = {
  slug: "support",
  title: "Synthetic QA policy " + randomUUID(),
  body: "Synthetic test policy. ".repeat(20),
  summary: "Synthetic archive QA",
  effectiveDate: "2026-01-01",
};
r = await req("/api/policies", "POST", draft);
status(r, 201);
const p1 = (await r.json()).version;
assert.equal(p1.effective_date, draft.effectiveDate);
checks++;
status(await req("/api/public/policies?slug=support&version=" + p1.id), 400);
status(
  await req("/api/policies/" + p1.id + "/publish", "POST", {}, { cookie: "" }),
  401,
);
status(await req("/api/policies/" + p1.id + "/publish", "POST", {}), 200);
status(await req("/api/policies/" + p1.id + "/publish", "POST", {}), 409);
r = await req("/api/public/policies?slug=support");
status(r, 200);
assert.equal((await r.json()).policy.id, p1.id);
checks++;
r = await req("/api/policies", "POST", {
  ...draft,
  body: draft.body + "revision",
});
status(r, 201);
const p2 = (await r.json()).version;
status(await req("/api/policies/" + p2.id + "/publish", "POST", {}), 200);
r = await req("/api/public/policies?slug=support&version=" + p1.id);
status(r, 400);
r = await req("/api/public/policies?slug=support");
const current = await r.json();
assert.equal(current.policy.id, p2.id);
assert.equal("versions" in current, false);
checks += 2;
await assert.rejects(
  db`UPDATE sideby_policy_versions SET body='mutated' WHERE id=${p1.id}`,
);
checks++;
await assert.rejects(db`DELETE FROM sideby_policy_versions WHERE id=${p1.id}`);
checks++;
const bug = {
  name: "Synthetic tester",
  email: "qa@example.invalid",
  category: "bug",
  subject: "Synthetic API QA",
  description: "Synthetic integration report for testing only.",
  website: "",
};
status(
  await req("/api/public/bugs", "POST", bug, {
    origin: "https://evil.example",
  }),
  403,
);
status(
  await req(
    "/api/public/bugs",
    "POST",
    { ...bug, email: "bad" },
    { origin: web },
  ),
  400,
);
status(
  await req(
    "/api/public/bugs",
    "POST",
    { ...bug, website: "spam" },
    { origin: web },
  ),
  400,
);
const historicalRequest = {
  ...bug,
  category: "privacy",
  subject: "Historical policy request",
  description:
    "Historical policy request: privacy. Date: 2026-01-01 through 2026-02-01. Please share privately.",
};
r = await req("/api/public/bugs", "POST", historicalRequest, { origin: web });
status(r, 201);
const id = (await r.json()).reference;
assert.equal(r.headers.get("access-control-allow-origin"), web);
checks++;
status(await req("/api/bugs", "GET", undefined, { cookie: "" }), 401);
status(
  await req("/api/bugs/" + id, "PATCH", { status: "resolved" }, { cookie: "" }),
  401,
);
status(await req("/api/bugs/" + id, "PATCH", { status: "resolved" }), 200);
r = await req("/api/bugs");
status(r, 200);
const storedReport = (await r.json()).reports.find((x) => x.id === id);
assert.equal(storedReport.status, "resolved");
assert.equal(storedReport.description, historicalRequest.description);
assert.equal(storedReport.category, "privacy");
checks += 2;
checks++;
status(await req("/api/bugs?page=-1"), 400);
status(
  await req(
    "/api/public/bugs",
    "POST",
    { ...bug, description: "x".repeat(11000) },
    { origin: web },
  ),
  413,
);
status(await req("/api/public/bugs", "POST", bug, { origin: web }), 201);
status(await req("/api/public/bugs", "POST", bug, { origin: web }), 429);
status(await req("/api/maintenance"), 401);
status(await req("/api/logout", "POST", {}), 200);
status(await req("/api/overview"), 401);
await db`DELETE FROM sideby_admin_limits`;
for (let i = 0; i < 10; i++)
  status(
    await req("/api/login", "POST", { ...credentials, password: "wrong" }),
    401,
  );
status(await req("/api/login", "POST", credentials), 429);
await db`DELETE FROM sideby_admin_limits`;
status(await req("/api/login", "POST", credentials, { capture: true }), 200);
const token = cookie.split("=")[1];
await db`UPDATE sideby_admin_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=${createHash("sha256").update(token).digest("hex")}`;
status(await req("/api/overview"), 401);
await db`DELETE FROM sideby_bug_reports WHERE id=${id}`;
await db`DELETE FROM sideby_bug_reports WHERE email='qa@example.invalid' AND subject='Synthetic API QA'`;
await db`DELETE FROM sideby_admin_limits`;
const expiredReport =
  await db`INSERT INTO sideby_bug_reports(email,category,subject,description,created_at) VALUES('qa@example.invalid','bug','Synthetic retention QA','Synthetic old report for retention verification',now()-interval '181 days') RETURNING id`;
const freshReport =
  await db`INSERT INTO sideby_bug_reports(email,category,subject,description) VALUES('qa@example.invalid','bug','Synthetic retention QA','Synthetic fresh report for retention verification') RETURNING id`;
status(
  await req("/api/maintenance", "GET", undefined, {
    headers: { Authorization: "Bearer " + process.env.CRON_SECRET },
  }),
  200,
);
assert.equal(
  (await db`SELECT id FROM sideby_bug_reports WHERE id=${expiredReport[0].id}`)
    .length,
  0,
);
checks++;
assert.equal(
  (await db`SELECT id FROM sideby_bug_reports WHERE id=${freshReport[0].id}`)
    .length,
  1,
);
checks++;
await db`DELETE FROM sideby_bug_reports WHERE id=${freshReport[0].id}`;
console.log(
  `PASS ${checks} admin/API assertions (Neon dev). Synthetic immutable policy versions retained in dev archive.`,
);
