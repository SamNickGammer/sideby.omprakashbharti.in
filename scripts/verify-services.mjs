import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRealtimeClient } from "@neon/realtime/client";
import sharp from "sharp";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const run = randomUUID().slice(0, 8);
const users = [];
const previousUsers = existsSync(".test-users.json")
  ? JSON.parse(readFileSync(".test-users.json", "utf8"))
  : [];
let rt, subscription;
function session() {
  let jar = new Map();
  return {
    async request(path, method = "GET", body, raw = false) {
      const res = await fetch(base + path, {
        method,
        headers: {
          Origin: base,
          Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(body && !raw ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? (raw ? body : JSON.stringify(body)) : undefined,
        redirect: "manual",
      });
      for (const h of res.headers.getSetCookie()) {
        const [pair] = h.split(";");
        const n = pair.indexOf("=");
        jar.set(pair.slice(0, n), pair.slice(n + 1));
      }
      return res;
    },
    cookies() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
  };
}
async function expect(res, status, label) {
  if (res.status !== status) {
    const body = await res.text();
    console.log("FAIL", label, res.status, body.slice(0, 350));
    throw new Error(label);
  }
  return res;
}
const a = session(),
  b = session();
try {
  await expect(await a.request("/api/family"), 401, "unauthenticated family");
  console.log("PASS unauthenticated family access denied (401)");
  for (const [client, suffix] of [
    [a, "a"],
    [b, "b"],
  ]) {
    const email = `sideby-test-${run}-${suffix}@example.com`;
    const password = randomUUID() + "Aa1!";
    const r = await expect(
      await client.request("/api/auth/sign-up/email", "POST", {
        name: "Sideby Test " + suffix,
        email,
        password,
      }),
      200,
      "sign up",
    );
    const data = await r.json();
    users.push(data.user.id);
    writeFileSync(
      ".test-users.json",
      JSON.stringify([...previousUsers, ...users]),
      { mode: 0o600 },
    );
    await expect(await client.request("/api/family"), 200, "signed in session");
    await expect(
      await client.request("/api/family", "POST", {
        name: "Test family " + suffix,
      }),
      201,
      "create family",
    );
    if (suffix === "a")
      writeFileSync(
        ".test-session.json",
        JSON.stringify({
          email,
          password,
          cookie: client.cookies(),
          userId: data.user.id,
        }),
        { mode: 0o600 },
      );
  }
  console.log(
    "PASS Neon Auth registration + server-verified sessions (two separate users)",
  );
  const child = {
    name: "Test child",
    age: 11,
    color: "mint",
    daily_limit: 120,
  };
  let r = await expect(
    await a.request("/api/children", "POST", child),
    201,
    "create child",
  );
  const { id } = await r.json();
  await expect(
    await b.request(`/api/children/${id}`, "PATCH", {
      ...child,
      name: "Forbidden",
    }),
    404,
    "cross-family mutation",
  );
  await expect(
    await b.request(`/api/avatar/${id}`),
    404,
    "cross-family avatar",
  );
  await expect(
    await a.request("/api/children", "POST", { ...child, age: 99 }),
    400,
    "invalid input",
  );
  console.log("PASS family isolation and input validation");
  const info = await (
    await expect(await a.request("/api/family"), 200, "read family")
  ).json();
  assert.equal(info.children[0].name, "Test child");
  const live = await (
    await expect(
      await a.request(`/api/live?userId=${users[0]}`),
      200,
      "seal query",
    )
  ).json();
  rt = createRealtimeClient({ url: live.url });
  subscription = rt.subscribe(live.sealed);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Realtime initial snapshot timed out")),
      20000,
    );
    subscription.onChange((s) => {
      if (s.status === "live" && s.data?.length) {
        clearTimeout(timer);
        resolve();
      }
      if (s.status === "error") {
        clearTimeout(timer);
        reject(s.error);
      }
    });
  });
  const old = subscription.getSnapshot().data[0].revision;
  await expect(
    await a.request(`/api/children/${id}`, "PATCH", {
      ...child,
      name: "Updated child",
    }),
    200,
    "update child",
  );
  await new Promise((resolve, reject) => {
    if (subscription.getSnapshot().data?.[0]?.revision > old) return resolve();
    const timer = setTimeout(
      () => reject(new Error("Realtime update timed out")),
      20000,
    );
    subscription.onChange((s) => {
      if (s.data?.[0]?.revision > old) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  console.log(
    "PASS Neon Realtime delivered a committed family revision after profile update",
  );
  const pixels = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#0f766e" },
  })
    .png()
    .toBuffer();
  const f = new FormData();
  f.set("file", new Blob([pixels], { type: "image/png" }), "test.png");
  await expect(
    await a.request(`/api/avatar/${id}`, "POST", f, true),
    200,
    "avatar upload",
  );
  r = await expect(await a.request(`/api/avatar/${id}`), 200, "avatar read");
  assert.equal(r.headers.get("content-type"), "image/webp");
  assert((await r.arrayBuffer()).byteLength > 0);
  console.log("PASS private object storage upload + authenticated image read");
  await expect(
    await a.request("/api/routines", "POST", {
      name: "Test bedtime",
      start_time: "21:00",
      end_time: "07:00",
      days: "daily",
      enabled: true,
    }),
    201,
    "create routine",
  );
  const family = await (await a.request("/api/family")).json();
  assert.equal(family.routines.length, 1);
  assert.equal(family.children[0].name, "Updated child");
  await expect(await a.request("/api/export"), 200, "export");
  console.log(
    "PASS Postgres persisted profiles + routines; family export works",
  );
  for (const archived of [true, false]) {
    await expect(
      await a.request(`/api/children/${id}`, "PATCH", {
        ...child,
        name: "Updated child",
        archived,
      }),
      200,
      "archive/restore",
    );
    const saved = await (await a.request("/api/family")).json();
    assert.equal(saved.children[0].archived, archived);
  }
  const routine = family.routines[0];
  const changed = {
    name: routine.name,
    start_time: routine.start_time,
    end_time: routine.end_time,
    days: routine.days,
    enabled: false,
  };
  await expect(
    await b.request(`/api/routines/${routine.id}`, "PATCH", changed),
    404,
    "cross-family routine",
  );
  await expect(
    await a.request(`/api/routines/${routine.id}`, "PATCH", changed),
    200,
    "toggle routine",
  );
  assert.equal(
    (await (await a.request("/api/family")).json()).routines[0].enabled,
    false,
  );
  await expect(
    await a.request(`/api/routines/${routine.id}`, "DELETE"),
    200,
    "delete routine",
  );
  assert.equal(
    (await (await a.request("/api/family")).json()).routines.length,
    0,
  );
  console.log("PASS profile archive/restore and routine update/delete persist");
  const before = await fetch(base + "/api/family", {
    method: "PATCH",
    headers: {
      Cookie: a.cookies(),
      Origin: "https://wrong.example",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Bad" }),
  });
  assert.equal(before.status, 403);
  console.log("PASS cross-origin mutation rejected (403)");
  await expect(
    await b.request("/api/auth/sign-out", "POST", {}),
    200,
    "sign out",
  );
  await expect(await b.request("/api/family"), 401, "revoked signout");
  console.log("PASS sign-out denies subsequent protected access");
  console.log("ALL LIVE SERVICE CHECKS PASSED");
} catch (e) {
  console.error("Verification failed:", e.message);
  process.exitCode = 1;
} finally {
  subscription?.unsubscribe();
  rt?.close();
  writeFileSync(
    ".test-users.json",
    JSON.stringify([...previousUsers, ...users]),
    { mode: 0o600 },
  );
}

// The preview Realtime SDK can retain transport timers after close.
setTimeout(() => process.exit(process.exitCode || 0), 250).unref();
