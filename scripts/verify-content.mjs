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

const profile={name:"Test content child",age:12,color:"mint"};
const {id}=await expect(await a.req("/api/children","POST",profile),201);
const path=`/api/children/${id}`;
const token=randomBytes(32).toString("hex"),otherToken=randomBytes(32).toString("hex");
const send=(kind,body,t=token)=>publicClient.req(`/api/device/content/${kind}`,"POST",body,{Authorization:`Bearer ${t}`});
const moment=Date.now()-20000;
let seq=0;
const report=(items,status="ready",time=moment+(++seq)*100)=>({version:1,status,generated_at:new Date(time).toISOString(),items,omitted:0});
const offer=await expect(await a.req(path+"/pairing","POST"),201);
await expect(await send("apps",report([])),401);
await expect(await publicClient.req("/api/device/claim","POST",{code:offer.code,credential:token,name:"Synthetic content device",platform:"android"}),200);
await expect(await send("apps",report([])),401);
await expect(await a.req(path+"/pairing","PATCH",{id:offer.id,action:"approve"}),200);
const perms={version:1,app_version:"test-0.4.0",android_api:37,permissions:Object.fromEntries(["internet","camera","microphone","location","notifications","usage","photos","contacts","sms","call_history","screen_share"].map(key=>[key,["internet","notifications","contacts","sms","call_history"].includes(key)?"granted":"not_available"]))};
await expect(await send("contacts",report([])),409);
const permission=()=>publicClient.req("/api/device/permissions","POST",perms,{Authorization:`Bearer ${token}`});
await expect(await permission(),200);
const {default:sharp}=await import("sharp");
const photo=(await sharp({create:{width:32,height:32,channels:3,background:"#8ab5a5"}}).png().toBuffer()).toString("base64");
const fixtures={
 apps:[{id:"example.synthetic",name:"Synthetic Test App",version:"1.0",system:false}],
 contacts:[{id:"contact1",name:"Synthetic Contact",number:"+15550101000"}],
 notifications:[{id:"n1",package:"example.synthetic",app:"Synthetic Test App",title:"Synthetic preview",text:"Meet at the park",time:new Date(moment-1000).toISOString(),redacted:false}],
 sms:[{id:"sms1",address:"+15550101000",body:"Synthetic test message",direction:"incoming",time:new Date(moment-1000).toISOString()}],
 calls:[{id:"call1",number:"+15550101000",type:"incoming",duration:12,time:new Date(moment-1000).toISOString()}],
 photos:[{id:randomUUID(),image:photo}]
};
let deviceId;
for(const [kind,items] of Object.entries(fixtures)) {
 const r=report(items);
 await expect(await send(kind,r,otherToken),401);
 await expect(await publicClient.req(path+`/content/${kind}`),401);
 await expect(await b.req(path+`/content/${kind}`),404);
 await expect(await send(kind,{...r,unexpected:"no"}),400);
 await expect(await send(kind,{...r,items:[...items,...items]}),400);
 await expect(await send(kind,{...r,generated_at:new Date(Date.now()+600000).toISOString()}),400);
 await expect(await send(kind,{...r,status:"disabled"}),400);
 await expect(await send(kind,r),200);
 await expect(await send(kind,r),200);
 let view=await expect(await a.req(path+`/content/${kind}`),200);
 deviceId=view.devices[0].id;
 assert.equal(view.devices[0].report.items.length,1);
 assert.ok(!JSON.stringify(view).includes(token));
 if(kind==="photos") {
  assert.deepEqual(view.devices[0].report.items,[{id:items[0].id}]);
  const imagePath=path+`/photos/${items[0].id}`;
  await expect(await publicClient.req(imagePath),401);await expect(await b.req(imagePath),404);
  const img=await a.req(imagePath);assert.equal(img.status,200);assert.equal(img.headers.get("content-type"),"image/webp");
  const metadata=await sharp(Buffer.from(await img.arrayBuffer())).metadata();assert.equal(metadata.width,32);assert.equal(metadata.exif,undefined);
  const replacementId=randomUUID();
  await expect(await send("photos",report([{id:replacementId,image:photo}])),200);
  await expect(await a.req(imagePath),404);
  const replaced=await a.req(path+`/photos/${replacementId}`);assert.equal(replaced.status,200);
  const [gc]=await sql`SELECT count(*)::int AS count FROM sideby_content_gc WHERE NOT pending_upload`;assert.equal(gc.count,0);
 }
 await expect(await send(kind,{...r,generated_at:new Date(moment-100).toISOString()}),409);
 await expect(await b.req(path+`/content/${kind}?device=${deviceId}`,"DELETE"),404);
 await expect(await a.req(path+`/content/${kind}?device=${deviceId}`,"DELETE"),200);
 view=await expect(await a.req(path+`/content/${kind}`),200);assert.equal(view.devices[0].report.status,"disabled");assert.equal(view.devices[0].report.items.length,0);
 // Server-side deletion advances the watermark; stale device reports cannot restore it.
 await expect(await send(kind,r),409);
 if(kind==="photos")await expect(await a.req(path+`/photos/${items[0].id}`),404);
}
// Restore current snapshots, verify per-permission revocation and redaction.
seq=0;
for(const kind of ["contacts","notifications","sms","calls"]) {
 const items=JSON.parse(JSON.stringify(fixtures[kind]));
 if(kind==="notifications")items[0].text="Verification code 123456";
 await expect(await send(kind,report(items,"ready",Date.now()+1000)),200);
 if(kind==="notifications") {
  const v=await expect(await a.req(path+"/content/notifications"),200);assert.equal(v.devices[0].report.items[0].redacted,true);assert.ok(!JSON.stringify(v).includes("123456"));
 }
 perms.permissions[kind==="calls"?"call_history":kind]="not_granted";
 await expect(await permission(),200);
 const v=await expect(await a.req(path+`/content/${kind}`),200);assert.equal(v.devices[0].report.items.length,0);
 await expect(await send(kind,report(items,"ready",Date.now()+2000)),409);
}
await expect(await send("apps",{...report([]),extra:"x".repeat(270000)}),413);
await expect(await send("photos",report([{id:randomUUID(),image:"bm90YW5pbWFnZQ=="}],"ready",Date.now()+2000)),400);
// Independent second installation.
const offer2=await expect(await a.req(path+"/pairing","POST"),201);
await expect(await publicClient.req("/api/device/claim","POST",{code:offer2.code,credential:otherToken,name:"Synthetic second device",platform:"android"}),200);
await expect(await a.req(path+"/pairing","PATCH",{id:offer2.id,action:"approve"}),200);
await expect(await publicClient.req("/api/device/permissions","POST",perms,{Authorization:`Bearer ${otherToken}`}),200);
await expect(await send("apps",report([{...fixtures.apps[0],name:"Second device app"}],"ready",Date.now()+2000),otherToken),200);
let view=await expect(await a.req(path+"/content/apps"),200);assert.equal(view.devices.length,2);assert.equal(view.devices.find(d=>d.id===deviceId).report.status,"disabled");
await sql`UPDATE sideby_devices SET credential_expires_at=now()-interval '1 second' WHERE id=${deviceId}`;
await expect(await send("apps",report([])),401);
view=await expect(await a.req(path+"/content/apps"),200);assert.equal(view.devices.find(d=>d.id===deviceId).report,null);
await sql`UPDATE sideby_devices SET credential_expires_at=now()+interval '1 hour' WHERE id=${deviceId}`;
await expect(await a.req(path,"PATCH",{...profile,archived:true}),200);
await expect(await send("apps",report([]),otherToken),401);
view=await expect(await a.req(path+"/content/apps"),200);assert.ok(view.devices.every(d=>d.inactive&&d.report===null));
await expect(await a.req(path,"PATCH",{...profile,archived:false}),200);
await expect(await a.req(path+`/devices/${deviceId}`,"DELETE"),200);
await expect(await send("apps",report([])),401);
const [cleared]=await sql`SELECT content_reports FROM sideby_devices WHERE id=${deviceId}`;assert.deepEqual(cleared.content_reports,{});
console.log(`PASS ${checks} content HTTP checks plus snapshot/private-image assertions across six categories`);
