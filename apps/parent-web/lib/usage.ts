import "server-only";
import { sql } from "./db";
import { digest, smallBody } from "./pairing";
import { HttpError } from "./http";
import { usageReportSchema } from "./device-usage";
export async function receiveUsage(req:Request) {
  const token=req.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401,"Device is not authorized.");
  const report=usageReportSchema.parse(await smallBody(req,65536));
  // Lock/check/update in one SQL statement so stop/revoke and delayed uploads cannot race the check.
  const rows=await sql`WITH authorized AS MATERIALIZED (
    SELECT d.id,d.usage_report,d.usage_sample_at,d.usage_updated_at,d.permission_report FROM sideby_devices d
    WHERE credential_hash=${digest(token)} AND revoked_at IS NULL AND credential_expires_at>now()
    AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=d.child_id AND NOT c.archived) FOR UPDATE
  ), changed AS (
    UPDATE sideby_devices d SET usage_report=${JSON.stringify(report)}::jsonb,usage_updated_at=now(),usage_sample_at=${report.generated_at}::timestamptz
    FROM authorized a WHERE d.id=a.id
    AND (${report.status}<>'ready' OR a.permission_report->'permissions'->>'usage'='granted')
    AND (a.usage_sample_at IS NULL OR a.usage_sample_at<${report.generated_at}::timestamptz)
    RETURNING d.usage_updated_at
  ) SELECT a.id,a.usage_sample_at::text AS previous_sample,
    a.permission_report->'permissions'->>'usage' AS permission,
    COALESCE((SELECT usage_updated_at FROM changed),a.usage_updated_at) AS received_at,
    EXISTS(SELECT 1 FROM changed) AS changed FROM authorized a`;
  const row=rows[0];
  if(!row)throw new HttpError(401,"Device is not authorized.");
  if(report.status==="ready" && row.permission!=="granted")throw new HttpError(409,"Report current Usage Access before uploading usage.");
  if(!row.changed && Date.parse(row.previous_sample)!==Date.parse(report.generated_at))throw new HttpError(409,"A newer usage report already exists.");
  return {status:"received",received_at:row.received_at};
}
export async function usageSnapshot(childId:string) {
  const devices=await sql`SELECT d.id,d.name,
    (d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived) AS inactive,
    CASE WHEN d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived THEN NULL
         WHEN d.usage_report->>'status'='ready' AND COALESCE(d.permission_report->'permissions'->>'usage','')<>'granted' THEN NULL
         ELSE d.usage_report END AS report,d.usage_updated_at AS received_at
    FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE c.id=${childId} ORDER BY d.created_at DESC`;
  return {devices};
}
