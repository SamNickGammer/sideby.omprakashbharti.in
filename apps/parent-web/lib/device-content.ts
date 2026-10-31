import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "./db";
import { s3,bucket } from "./storage";
import { digest,smallBody } from "./pairing";
import { HttpError } from "./http";
import { contentSchema,permissions,type ContentKind,type ContentReport } from "./content-contract";

export async function collectGarbage() {
  const keys=await sql`SELECT object_key FROM sideby_content_gc WHERE NOT pending_upload OR created_at<now()-interval '30 minutes' ORDER BY created_at LIMIT 30`;
  for(const row of keys) {
    try {
      await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:row.object_key}));
      await sql`DELETE FROM sideby_content_gc WHERE object_key=${row.object_key}`;
    } catch { /* Retain the durable deletion job for retry; never log image data. */ }
  }
}
export async function receiveContent(req:Request,kind:ContentKind) {
  const token=req.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if(!token)throw new HttpError(401,"Device is not authorized.");
  const hash=digest(token),permission=permissions[kind]||"internet";
  const [device]=await sql`SELECT d.id FROM sideby_devices d WHERE credential_hash=${hash} AND revoked_at IS NULL AND credential_expires_at>now() AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=d.child_id AND NOT c.archived)`;
  if(!device)throw new HttpError(401,"Device is not authorized.");
  const parsed=contentSchema(kind).parse(await smallBody(req,kind==="photos"?3*1024*1024:256*1024));
  // Treat sensitive previews as unavailable even if an old client sends text.
  if(kind==="notifications")for(const item of parsed.items)if("redacted" in item && (item.redacted || /\b\d{4,8}\b|\botp\b|verification code|password|passcode/i.test(item.title+" "+item.text))) {
    item.title="Sensitive notification";item.text="Content withheld";item.redacted=true;
  }
  if(kind==="sms")for(const item of parsed.items)if("body" in item && /\b\d{4,8}\b|\botp\b|verification code|password|passcode/i.test(item.body))item.body="Sensitive message withheld";
  const uploaded:string[]=[];
  const report:ContentReport={...parsed,items:[],received_at:new Date().toISOString()};
  try {
    if(kind==="photos") {
      // Check the watermark before expensive media processing; rechecked atomically below.
      const [old]=await sql`SELECT content_samples->>${kind} AS sample FROM sideby_devices WHERE id=${device.id}`;
      if(old.sample && Date.parse(old.sample)>=Date.parse(parsed.generated_at)) {
        if(Date.parse(old.sample)===Date.parse(parsed.generated_at))return {status:"received"};
        throw new HttpError(409,"A newer report already exists.");
      }
      for(const item of parsed.items) {
        if(!("image" in item))throw new HttpError(400,"Invalid image.");
        let bytes:Buffer;
        try { bytes=await sharp(Buffer.from(item.image,"base64"),{limitInputPixels:16000000,animated:false}).rotate().resize(1200,1200,{fit:"inside",withoutEnlargement:true}).webp({quality:80}).toBuffer(); }
        catch { throw new HttpError(400,"Choose a supported image under 16 megapixels."); }
        const key=`device-photos/${device.id}/${randomUUID()}.webp`;
        // Persist a cleanup job before upload; successful commit removes it atomically.
        await sql`INSERT INTO sideby_content_gc(object_key,pending_upload) VALUES(${key},true)`;
        uploaded.push(key);
        await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:"image/webp"}));
        report.items.push({id:item.id,key});
      }
    } else report.items=parsed.items;
    const [row]=await sql`WITH authorized AS MATERIALIZED (
      SELECT d.id,d.content_reports,d.content_samples->>${kind} AS sample,d.permission_report FROM sideby_devices d
      WHERE credential_hash=${hash} AND revoked_at IS NULL AND credential_expires_at>now()
      AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=d.child_id AND NOT c.archived) FOR UPDATE
    ), changed AS (
      UPDATE sideby_devices d SET content_reports=jsonb_set(d.content_reports,ARRAY[${kind}],${JSON.stringify(report)}::jsonb),
      content_samples=jsonb_set(d.content_samples,ARRAY[${kind}],to_jsonb(${parsed.generated_at}::text))
      FROM authorized a WHERE d.id=a.id AND (a.sample IS NULL OR a.sample::timestamptz<${parsed.generated_at}::timestamptz)
      AND (${parsed.status}<>'ready' OR a.permission_report->'permissions'->>${permission}='granted') RETURNING d.id
    ), queued AS (
      INSERT INTO sideby_content_gc(object_key)
      SELECT item->>'key' FROM authorized a, LATERAL jsonb_array_elements(COALESCE(a.content_reports->'photos'->'items','[]'::jsonb)) item
      WHERE ${kind}='photos' AND EXISTS(SELECT 1 FROM changed) ON CONFLICT DO NOTHING RETURNING object_key
    ), kept AS (
      DELETE FROM sideby_content_gc WHERE object_key=ANY(${uploaded}::text[]) AND EXISTS(SELECT 1 FROM changed) RETURNING object_key
    ) SELECT a.sample,a.permission_report->'permissions'->>${permission} AS permission,EXISTS(SELECT 1 FROM changed) AS changed,(SELECT count(*) FROM kept) AS kept FROM authorized a`;
    if(!row)throw new HttpError(401,"Device is not authorized.");
    if(parsed.status==="ready"&&row.permission!=="granted")throw new HttpError(409,"Report the required permission first.");
    if(!row.changed&&Date.parse(row.sample)!==Date.parse(parsed.generated_at))throw new HttpError(409,"A newer report already exists.");
    if(kind==="photos")await collectGarbage();
    return {status:"received"};
  } catch(e) {
    if(uploaded.length) {
      await sql`UPDATE sideby_content_gc SET pending_upload=false WHERE object_key=ANY(${uploaded}::text[])`;
      await collectGarbage();
    }
    throw e;
  }
}
export async function contentSnapshot(child:string,kind:ContentKind) {
  const permission=permissions[kind]||"internet";
  const devices=await sql`SELECT d.id,d.name,(d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived) AS inactive,
    CASE WHEN d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived THEN NULL
    WHEN d.content_reports->${kind}->>'status'='ready' AND COALESCE(d.permission_report->'permissions'->>${permission},'')<>'granted' THEN NULL
    ELSE d.content_reports->${kind} END AS report
    FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE c.id=${child} ORDER BY d.created_at DESC`;
  for(const device of devices)if(device.report) {
    const report=device.report as ContentReport;
    if(["notifications","sms","calls"].includes(kind))report.items=report.items.filter(i=>Date.parse(String(i.time))>=Date.now()-(kind==="notifications"?1:7)*86400000);
    // Never return storage keys, even to the owner.
    if(kind==="photos")report.items=report.items.map(i=>({id:i.id}));
  }
  return {devices};
}
export async function clearContent(child:string,device:string,kind:ContentKind) {
  const [row]=await sql`WITH old AS MATERIALIZED (SELECT id,content_reports FROM sideby_devices WHERE id=${device} AND child_id=${child} FOR UPDATE), queued AS (
    INSERT INTO sideby_content_gc(object_key) SELECT item->>'key' FROM old,LATERAL jsonb_array_elements(COALESCE(content_reports->'photos'->'items','[]'::jsonb)) item WHERE ${kind}='photos' ON CONFLICT DO NOTHING
  ) UPDATE sideby_devices SET content_reports=jsonb_set(content_reports,ARRAY[${kind}],jsonb_build_object('version',1,'status','disabled','items','[]'::jsonb,'omitted',0,'generated_at',now(),'received_at',now())),content_samples=jsonb_set(content_samples,ARRAY[${kind}],to_jsonb(now()::text)) WHERE id=${device} AND child_id=${child} RETURNING id`;
  if(!row)throw new HttpError(404,"Device not found.");
  if(kind==="photos")await collectGarbage();
}
export async function readPhoto(child:string,id:string) {
  const rows=await sql`SELECT item->>'key' AS key FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id,
    LATERAL jsonb_array_elements(COALESCE(d.content_reports->'photos'->'items','[]'::jsonb)) item
    WHERE c.id=${child} AND NOT c.archived AND d.revoked_at IS NULL AND d.credential_expires_at>now() AND item->>'id'=${id}`;
  if(!rows[0])throw new HttpError(404,"Photo not found.");
  const object=await s3.send(new GetObjectCommand({Bucket:bucket,Key:rows[0].key}));
  if(!object.Body)throw new HttpError(404,"Photo not found.");
  return new Response(new Uint8Array(await object.Body.transformToByteArray()).buffer,{headers:{"Content-Type":"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
