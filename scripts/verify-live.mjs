import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
if (process.env.NEON_BRANCH !== "dev")
  throw new Error("Live verification requires Neon dev");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3005",
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

const { createHash } = await import("node:crypto");
const { RoomServiceClient } = await import("livekit-server-sdk");
const media = new RoomServiceClient(
  process.env.LIVEKIT_API_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET,
);
const profile = { name: "Test live child", age: 12, color: "mint" };
const { id } = await expect(await a.req("/api/children", "POST", profile), 201);
const path = `/api/children/${id}`,
  live = path + "/live";
const token = randomBytes(32).toString("hex");
const offer = await expect(await a.req(path + "/pairing", "POST"), 201);
await expect(
  await publicClient.req("/api/device/claim", "POST", {
    code: offer.code,
    credential: token,
    name: "Synthetic live device",
    platform: "android",
  }),
  200,
);
await expect(
  await a.req(path + "/pairing", "PATCH", { id: offer.id, action: "approve" }),
  200,
);
const [{ id: device }] =
  await sql`SELECT id FROM sideby_devices WHERE credential_hash=${createHash("sha256").update(token).digest("hex")}`;
const d = (sid, action, extra = {}, credential = token) =>
  publicClient.req(
    "/api/device/live" + (sid ? "/" + sid : ""),
    "POST",
    { action, ...extra },
    { Authorization: "Bearer " + credential },
  );
const start = async (kind = "screen") =>
  (await expect(await a.req(live, "POST", { device_id: device, kind }), 201))
    .session;
const p = (sid, action, extra = {}) =>
  a.req(live + "/" + sid, "POST", { action, ...extra });
await expect(await publicClient.req(live), 401);
await expect(await b.req(live), 404);
await expect(
  await a.req(
    live,
    "POST",
    { device_id: device, kind: "screen" },
    { Origin: "https://foreign.example" },
  ),
  403,
);
await expect(await d(null, "poll", {}, randomBytes(32).toString("hex")), 401);
await expect(
  await a.req(live, "POST", {
    device_id: device,
    kind: "screen",
    lens: "back",
  }),
  400,
);
await expect(
  await a.req(live, "POST", { device_id: device, kind: "hidden" }),
  400,
);
await expect(
  await a.req(live, "POST", { device_id: randomUUID(), kind: "screen" }),
  409,
);
let s = await start();
await expect(
  await a.req(live, "POST", { device_id: device, kind: "camera" }),
  409,
);
await expect(await p(s.id, "join"), 409);
await expect(await d(s.id, "join"), 409);
await expect(await p(s.id, "lens", { lens: "back" }), 409);
assert.equal((await expect(await d(null, "poll"), 200)).session.id, s.id);
await expect(await b.req(live + "/" + s.id, "POST", { action: "join" }), 404);
const other = randomBytes(32).toString("hex");
await sql`INSERT INTO sideby_devices(child_id,pairing_id,name,credential_hash) VALUES(${id},${randomUUID()},'Synthetic other device',${createHash("sha256").update(other).digest("hex")})`;
await expect(await d(s.id, "approve", {}, other), 404);
await expect(await d(s.id, "approve"), 200);
await expect(await d(s.id, "approve"), 409);
const pub = await expect(await d(s.id, "join"), 200),
  sub = await expect(await p(s.id, "join"), 200);
const decode = (t) => JSON.parse(Buffer.from(t.split(".")[1], "base64url"));
const pg = decode(pub.token),
  sg = decode(sub.token);
assert.equal(pg.video.canPublish, true);
assert.equal(pg.video.canSubscribe, false);
assert.equal(pg.video.canPublishData, false);
assert.deepEqual(pg.video.canPublishSources, ["screen_share"]);
assert.equal(sg.video.canPublish, false);
assert.equal(sg.video.canSubscribe, true);
assert.equal(sg.video.canPublishData, false);
assert.equal(pg.video.room, sg.video.room);
assert.ok(pg.exp - pg.nbf <= 15);
await expect(await d(s.id, "pulse", { lens: "back" }), 400);
assert.equal(
  (await expect(await d(s.id, "pulse"), 200)).session.status,
  "active",
);
await expect(await p(s.id, "stop"), 200);
assert.equal((await expect(await p(s.id, "join"), 200)).token, undefined);
await expect(await d(s.id, "join"), 409);
await expect(await d(s.id, "stop"), 200);
// Terminal room re-created with a captured token is cleaned by the supervisor.
await media.createRoom({ name: pg.video.room });
await new Promise((r) => setTimeout(r, 5000));
assert.equal((await media.listRooms([pg.video.room])).length, 0);
console.log("PASS scoped grants and terminal-room cleanup");
s = await start("camera");
await expect(await d(s.id, "decline"), 200);
await expect(await d(s.id, "approve"), 409);
s = await start("camera");
await expect(await d(s.id, "approve"), 200);
const cam = decode((await expect(await d(s.id, "join"), 200)).token);
assert.deepEqual(cam.video.canPublishSources, ["camera"]);
await expect(await p(s.id, "lens", { lens: "back" }), 200);
const camera = await expect(await d(s.id, "pulse", { lens: "front" }), 200);
assert.equal(camera.session.desired_lens, "back");
assert.equal(camera.session.actual_lens, "front");
await expect(await d(s.id, "pulse", { lens: "back" }), 200);
await expect(await p(s.id, "stop"), 200);
s = await start("audio");
await expect(await d(s.id, "approve"), 200);
assert.deepEqual(
  decode((await expect(await d(s.id, "join"), 200)).token).video
    .canPublishSources,
  ["microphone"],
);
await sql`UPDATE sideby_live_sessions SET device_seen=now()-interval '30 seconds' WHERE id=${s.id}`;
assert.equal(
  (await expect(await p(s.id, "poll"), 200)).session.status,
  "expired",
);
await expect(await d(s.id, "join"), 409);
s = await start();
await sql`UPDATE sideby_live_sessions SET expires_at=now()-interval '1 second' WHERE id=${s.id}`;
await expect(await d(s.id, "approve"), 409);
s = await start();
await expect(await d(s.id, "approve"), 200);
await sql`UPDATE sideby_live_sessions SET parent_seen=now()-interval '30 seconds' WHERE id=${s.id}`;
assert.equal(
  (await expect(await d(s.id, "pulse"), 200)).session.status,
  "expired",
);
s = await start();
await expect(await d(s.id, "approve"), 200);
await sql`UPDATE sideby_devices SET revoked_at=now() WHERE id=${device}`;
await expect(await d(s.id, "pulse"), 401);
assert.equal(
  (await expect(await p(s.id, "poll"), 200)).session.status,
  "expired",
);
await sql`UPDATE sideby_devices SET revoked_at=NULL WHERE id=${device}`;
s = await start();
await sql`UPDATE sideby_children SET archived=true WHERE id=${id}`;
await expect(await d(s.id, "approve"), 401);
assert.equal(
  (await expect(await p(s.id, "poll"), 200)).session.status,
  "expired",
);
await sql`UPDATE sideby_children SET archived=false WHERE id=${id}`;
// A stale supervisor heartbeat must fail closed (the separate worker restores it).
await sql`UPDATE sideby_live_supervisor SET seen_at=now()-interval '1 minute'`;
await expect(
  await a.req(live, "POST", { device_id: device, kind: "screen" }),
  503,
);
console.log(
  `PASS ${checks} live HTTP checks plus grant, expiry, room cleanup and isolation assertions`,
);
