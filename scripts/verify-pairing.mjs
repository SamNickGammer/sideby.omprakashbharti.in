import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
  sql = neon(process.env.DATABASE_URL);
const run = randomUUID().slice(0, 8),
  users = existsSync(".test-users.json")
    ? JSON.parse(readFileSync(".test-users.json", "utf8"))
    : [];
function client() {
  const jar = new Map();
  return {
    async req(path, method = "GET", body, extra = {}) {
      const r = await fetch(base + path, {
        method,
        headers: {
          Origin: base,
          Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
          "Content-Type": "application/json",
          ...extra,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
      });
      for (const cookie of r.headers.getSetCookie()) {
        const pair = cookie.split(";")[0],
          n = pair.indexOf("=");
        jar.set(pair.slice(0, n), pair.slice(n + 1));
      }
      return r;
    },
    cookies() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
  };
}
let checks = 0;
async function expect(r, status) {
  assert.equal(r.status, status, `Expected ${status}, got ${r.status}`);
  checks++;
  return r.json();
}
const a = client(),
  b = client(),
  publicClient = client();
for (const [c, suffix] of [
  [a, "a"],
  [b, "b"],
]) {
  const email = `sideby-test-${run}-${suffix}@example.com`,
    password = randomUUID() + "Aa1!";
  const result = await expect(
    await c.req("/api/auth/sign-up/email", "POST", {
      name: `Sideby Test ${suffix}`,
      email,
      password,
    }),
    200,
  );
  users.push(result.user.id);
  writeFileSync(".test-users.json", JSON.stringify(users), { mode: 0o600 });
  await expect(
    await c.req("/api/family", "POST", { name: `Test family ${suffix}` }),
    201,
  );
  if (suffix === "a")
    writeFileSync(
      ".test-session.json",
      JSON.stringify({
        email,
        password,
        cookie: c.cookies(),
        userId: result.user.id,
      }),
      { mode: 0o600 },
    );
}
const profile = { name: "Test pairing child", age: 12, color: "mint" };
const { id } = await expect(await a.req("/api/children", "POST", profile), 201),
  path = `/api/children/${id}`;
await expect(await publicClient.req(path + "/devices"), 401);
await expect(await b.req(path + "/devices"), 404);
await expect(await b.req(path + "/pairing", "POST"), 404);
await expect(
  await a.req(path + "/pairing", "POST", undefined, {
    Origin: "https://untrusted.example",
  }),
  403,
);
let offer = await expect(await a.req(path + "/pairing", "POST"), 201);
const token = randomBytes(32).toString("hex"),
  claim = {
    code: offer.code,
    credential: token,
    name: "Test Android",
    platform: "android",
  };
const beat = (token) =>
  publicClient.req("/api/device/heartbeat", "POST", undefined, {
    Authorization: `Bearer ${token}`,
  });
await expect(await beat(token), 401);
const claimed = await expect(
  await publicClient.req("/api/device/claim", "POST", claim),
  200,
);
assert.equal(claimed.status, "pending");
await expect(await publicClient.req("/api/device/claim", "POST", claim), 200);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    credential: randomBytes(32).toString("hex"),
  }),
  404,
);
await expect(await beat(token), 401);
await expect(
  await b.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
  404,
);
await expect(
  await a.req(path + "/pairing", "PATCH", {
    id: randomUUID(),
    action: "approve",
  }),
  409,
);
let snapshot = await expect(await a.req(path + "/devices"), 200);
assert.equal(snapshot.pairing.verification, claimed.verification);
assert.equal(JSON.stringify(snapshot).includes(token), false);
assert.equal(snapshot.devices.length, 0);
const approvals = await Promise.all([
  a.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
  a.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
]);
for (const r of approvals) await expect(r, 200);
const device = await expect(await beat(token), 200);
assert.equal(device.status, "connected");
snapshot = await expect(await a.req(path + "/devices"), 200);
assert.equal(snapshot.devices.length, 1);
assert.ok(snapshot.devices[0].last_seen_at);
assert.ok(!JSON.stringify(snapshot).includes("credential_hash"));
await expect(await a.req(path, "PATCH", { ...profile, archived: true }), 200);
await expect(await beat(token), 401);
await expect(await a.req(path + "/pairing", "POST"), 409);
await expect(await a.req(path, "PATCH", { ...profile, archived: false }), 200);
await expect(await beat(token), 200);
console.log(
  "PASS ownership, origin, pending authentication, retry and concurrent approval, archive access",
);
// Multiple devices, simultaneous claims: only one installation can reserve a code.
offer = await expect(await a.req(path + "/pairing", "POST"), 201);
const token2 = randomBytes(32).toString("hex"),
  token3 = randomBytes(32).toString("hex");
const attempts = await Promise.all(
  [token2, token3].map((credential) =>
    publicClient.req("/api/device/claim", "POST", {
      ...claim,
      code: offer.code,
      credential,
    }),
  ),
);
assert.deepEqual(attempts.map((r) => r.status).sort(), [200, 404]);
checks += 2;
const winner = attempts[0].status === 200 ? token2 : token3;
await expect(
  await a.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
  200,
);
await expect(await beat(winner), 200);
snapshot = await expect(await a.req(path + "/devices"), 200);
assert.equal(snapshot.devices.length, 2);
await expect(await b.req(path + `/devices/${device.id}`, "DELETE"), 404);
await expect(await a.req(path + `/devices/${device.id}`, "DELETE"), 200);
await expect(await a.req(path + `/devices/${device.id}`, "DELETE"), 200);
await expect(await beat(token), 401);
await expect(await beat(winner), 200);
console.log(
  "PASS single claimant, multiple devices, isolated permanent credential revocation",
);
offer = await expect(await a.req(path + "/pairing", "POST"), 201);
await expect(
  await a.req(path + "/pairing", "PATCH", { id: offer.id, action: "cancel" }),
  200,
);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    code: offer.code,
  }),
  404,
);
offer = await expect(await a.req(path + "/pairing", "POST"), 201);
const flat = offer.code.replaceAll("-", ""),
  wrong =
    flat.slice(0, 8) + (flat.slice(8) === "00000000" ? "11111111" : "00000000");
for (let i = 0; i < 5; i++)
  await expect(
    await publicClient.req("/api/device/claim", "POST", {
      ...claim,
      code: wrong,
    }),
    404,
  );
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    code: offer.code,
  }),
  404,
);
snapshot = await expect(await a.req(path + "/devices"), 200);
assert.equal(snapshot.pairing.status, "locked");
offer = await expect(await a.req(path + "/pairing", "POST"), 201);
await sql`UPDATE sideby_pairings SET expires_at=now()-interval '1 second' WHERE child_id=${id}`;
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    code: offer.code,
  }),
  404,
);
await expect(
  await a.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
  409,
);
await expect(await a.req(path + "/pairing", "POST"), 429);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    code: "bad",
  }),
  400,
);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...claim,
    name: "x".repeat(3000),
  }),
  413,
);
console.log(
  "PASS cancellation, expiry, five-attempt lockout, generation limit, body limits",
);
const family = await expect(await a.req("/api/family"), 200);
assert.equal(family.children.find((c) => c.id === id).device_count, 1);
await sql`UPDATE sideby_devices SET credential_expires_at=now()-interval '1 second' WHERE child_id=${id}`;
await expect(await beat(winner), 401);
// Replacement and revoked/expired retries must not report successful pairing.
const extra = await expect(
  await a.req("/api/children", "POST", {
    ...profile,
    name: "Test retry child",
  }),
  201,
);
const extraPath = `/api/children/${extra.id}`;
const oldOffer = await expect(await a.req(extraPath + "/pairing", "POST"), 201);
const newOffer = await expect(await a.req(extraPath + "/pairing", "POST"), 201);
const extraToken = randomBytes(32).toString("hex");
const extraClaim = { ...claim, code: newOffer.code, credential: extraToken };
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...extraClaim,
    code: oldOffer.code,
  }),
  404,
);
await expect(
  await publicClient.req("/api/device/claim", "POST", extraClaim),
  200,
);
await expect(
  await a.req(extraPath + "/pairing", "PATCH", {
    id: newOffer.id,
    action: "approve",
  }),
  200,
);
const extraDevice = await expect(await beat(extraToken), 200);
await expect(await a.req(path + `/devices/${extraDevice.id}`, "DELETE"), 404);
await expect(
  await a.req(extraPath + `/devices/${extraDevice.id}`, "DELETE"),
  200,
);
await expect(
  await publicClient.req("/api/device/claim", "POST", extraClaim),
  404,
);
const pendingOffer = await expect(
  await a.req(extraPath + "/pairing", "POST"),
  201,
);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    ...extraClaim,
    code: pendingOffer.code,
    credential: randomBytes(32).toString("hex"),
  }),
  200,
);
await sql`UPDATE sideby_pairings SET expires_at=now()-interval '1 second' WHERE child_id=${extra.id}`;
await expect(
  await a.req(extraPath + "/pairing", "PATCH", {
    id: pendingOffer.id,
    action: "approve",
  }),
  409,
);
console.log(
  "PASS replacement invalidation, cross-child revoke denial, revoked retry denial and pending approval expiry",
);
// Leave only synthetic devices for browser review; cleanup-test-data removes this family afterward.
writeFileSync(".test-pairing.json", JSON.stringify({ childId: id }), {
  mode: 0o600,
});
console.log(
  `PASS ${checks} HTTP checks plus database/UI response assertions; synthetic child saved for browser review`,
);
