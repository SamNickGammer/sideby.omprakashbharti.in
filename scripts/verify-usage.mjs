import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
if (process.env.NEON_BRANCH !== "dev") throw new Error("Pairing verification requires Neon dev");
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

const profile={name:"Test usage child",age:12,color:"mint"};
const {id}=await expect(await a.req("/api/children","POST",profile),201);
const path=`/api/children/${id}`;
const offer=await expect(await a.req(path+"/pairing","POST"),201);
const token=randomBytes(32).toString("hex");
const deviceReq=(body,credential=token)=>publicClient.req("/api/device/usage","POST",body,{Authorization:`Bearer ${credential}`});
const sampleTime=Date.now()-10000;
function sample(time=sampleTime,status="ready") {
  const generated_at=new Date(time).toISOString();
  return {version:1,status,generated_at,day:generated_at.slice(0,10),timezone:"UTC",period_start:generated_at.slice(0,10)+"T00:00:00.000Z",apps:status==="ready"?[{package_name:"example.synthetic",name:"Synthetic App",foreground_ms:1000}]:[],omitted_apps:0};
}
await expect(await deviceReq(sample()),401);
await expect(await publicClient.req("/api/device/claim","POST",{code:offer.code,credential:token,name:"Synthetic usage device",platform:"android"}),200);
await expect(await deviceReq(sample()),401);
await expect(await a.req(path+"/pairing","PATCH",{id:offer.id,action:"approve"}),200);
const perms={version:1,app_version:"test-0.3.0",android_api:37,permissions:Object.fromEntries(["internet","camera","microphone","location","notifications","usage","photos","contacts","sms","call_history","screen_share"].map(key=>[key,["internet","usage"].includes(key)?"granted":"not_available"]))};
const permission=(grant)=>publicClient.req("/api/device/permissions","POST",{...perms,permissions:{...perms.permissions,usage:grant}},{Authorization:`Bearer ${token}`});
await expect(await deviceReq(sample()),409);
await expect(await permission("granted"),200);
await expect(await publicClient.req(path+"/usage"),401);
await expect(await b.req(path+"/usage"),404);
await expect(await deviceReq(sample(),randomBytes(32).toString("hex")),401);
let received=await expect(await deviceReq(sample()),200);
assert.ok(received.received_at);
let view=await expect(await a.req(path+"/usage"),200);
assert.deepEqual(view.devices[0].report,sample());
assert.ok(!JSON.stringify(view).includes(token));
await expect(await deviceReq(sample()),200);
view=await expect(await a.req(path+"/usage"),200);
assert.equal(view.devices[0].report.apps[0].foreground_ms,1000);
await expect(await deviceReq(sample(sampleTime-1)),409);
for(const bad of [
  {...sample(),child_id:randomUUID()},
  {...sample(),timezone:"Invalid/Timezone"},
  {...sample(),day:"2020-01-01"},
  {...sample(),period_start:sample().generated_at},
  {...sample(),apps:[...sample().apps,...sample().apps]},
  {...sample(),apps:[{...sample().apps[0],foreground_ms:-1}]},
  {...sample(),status:"disabled"},
  {...sample(),apps:[{...sample().apps[0],content:"must not collect"}]},
  sample(Date.now()+600000),
])await expect(await deviceReq(bad),400);
await expect(await deviceReq({...sample(),extra:"x".repeat(70000)}),413);
await expect(await deviceReq(sample(sampleTime+1000,"disabled")),200);
view=await expect(await a.req(path+"/usage"),200);
assert.equal(view.devices[0].report.status,"disabled");assert.equal(view.devices[0].report.apps.length,0);
await expect(await deviceReq(sample()),409);
await expect(await deviceReq(sample(sampleTime+2000)),200);
await expect(await permission("not_granted"),200);
view=await expect(await a.req(path+"/usage"),200);
assert.equal(view.devices[0].report,null);
await expect(await deviceReq(sample(sampleTime+3000)),409);
await expect(await deviceReq(sample(sampleTime+3000,"no_permission")),200);
await expect(await permission("granted"),200);
await expect(await deviceReq(sample(sampleTime+4000)),200);
await expect(await a.req(path,"PATCH",{...profile,archived:true}),200);
await expect(await deviceReq(sample(sampleTime+5000)),401);
view=await expect(await a.req(path+"/usage"),200);assert.equal(view.devices[0].report,null);assert.equal(view.devices[0].inactive,true);
await expect(await a.req(path,"PATCH",{...profile,archived:false}),200);
await sql`UPDATE sideby_devices SET credential_expires_at=now()-interval '1 second' WHERE child_id=${id}`;
await expect(await deviceReq(sample(sampleTime+5000)),401);
view=await expect(await a.req(path+"/usage"),200);assert.equal(view.devices[0].report,null);
await sql`UPDATE sideby_devices SET credential_expires_at=now()+interval '1 hour' WHERE child_id=${id}`;
await expect(await a.req(path+`/devices/${view.devices[0].id}`,"DELETE"),200);
await expect(await deviceReq(sample(sampleTime+5000)),401);
const [cleared]=await sql`SELECT usage_report FROM sideby_devices WHERE child_id=${id}`;assert.equal(cleared.usage_report,null);
// Two independently paired devices must retain distinct usage snapshots.
for (const name of ["Synthetic phone", "Synthetic tablet"]) {
  const nextOffer=await expect(await a.req(path+"/pairing","POST"),201);
  const nextToken=randomBytes(32).toString("hex");
  await expect(await publicClient.req("/api/device/claim","POST",{code:nextOffer.code,credential:nextToken,name,platform:"android"}),200);
  await expect(await a.req(path+"/pairing","PATCH",{id:nextOffer.id,action:"approve"}),200);
  await expect(await publicClient.req("/api/device/permissions","POST",perms,{Authorization:`Bearer ${nextToken}`}),200);
  const report=sample(sampleTime+6000);
  report.apps[0].name=name;
  await expect(await deviceReq(report,nextToken),200);
}
view=await expect(await a.req(path+"/usage"),200);
const active=view.devices.filter(device=>!device.inactive);
assert.equal(active.length,2);
assert.deepEqual(active.map(device=>device.report.apps[0].name).sort(),["Synthetic phone","Synthetic tablet"]);
assert.equal(new Set(active.map(device=>device.id)).size,2);
console.log(`PASS ${checks} usage HTTP checks plus snapshot assertions: ownership, strict validation, idempotency, old-report rejection, disable, revoke, archive, expiry and disconnect cleanup`);
