import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { sql } from "./db";
import { HttpError } from "./http";
import { permissionReportSchema } from "./device-permissions";

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function smallBody(req: Request, limit = 2048) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "JSON body required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, "Request too large.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function ownedChild(
  childId: string,
  userId: string,
  active = false,
) {
  const [row] =
    await sql`SELECT c.id,c.family_id,c.archived FROM sideby_children c JOIN sideby_families f ON f.id=c.family_id WHERE c.id=${childId} AND f.owner_id=${userId}`;
  if (!row) throw new HttpError(404, "Child profile not found.");
  if (active && row.archived)
    throw new HttpError(409, "Restore this profile before pairing.");
  return row;
}
export async function deviceSnapshot(childId: string) {
  const [devices, offers] = await Promise.all([
    sql`SELECT id,name,platform,created_at,last_seen_at,revoked_at,credential_expires_at,permission_report,permissions_updated_at FROM sideby_devices WHERE child_id=${childId} ORDER BY created_at DESC`,
    sql`SELECT id,CASE WHEN status IN ('offered','pending') AND expires_at<=now() THEN 'expired' WHEN status='offered' AND attempts>=5 THEN 'locked' ELSE status END AS status,expires_at,device_name,verification FROM sideby_pairings WHERE child_id=${childId}`,
  ]);
  return { devices, pairing: offers[0] || null };
}
export async function createOffer(childId: string, familyId: string) {
  const code = randomBytes(8).toString("hex").toUpperCase();
  const [, rows] = await sql.transaction([
    sql`SELECT id FROM sideby_children WHERE id=${childId} FOR UPDATE`,
    sql`INSERT INTO sideby_pairings(child_id,selector,code_hash,status,expires_at)
      SELECT id,${code.slice(0, 8)},${digest(code)},'offered',now()+interval '10 minutes' FROM sideby_children WHERE id=${childId} AND NOT archived
      ON CONFLICT(child_id) DO UPDATE SET id=gen_random_uuid(),selector=EXCLUDED.selector,code_hash=EXCLUDED.code_hash,status='offered',expires_at=EXCLUDED.expires_at,attempts=0,credential_hash=NULL,device_name=NULL,verification=NULL,
      generation_count=CASE WHEN sideby_pairings.window_started_at<=now()-interval '10 minutes' THEN 1 ELSE sideby_pairings.generation_count+1 END,
      window_started_at=CASE WHEN sideby_pairings.window_started_at<=now()-interval '10 minutes' THEN now() ELSE sideby_pairings.window_started_at END
      WHERE sideby_pairings.window_started_at<=now()-interval '10 minutes' OR sideby_pairings.generation_count<5
      RETURNING id,expires_at`,
    sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${familyId}`,
  ]);
  if (!rows.length)
    throw new HttpError(
      429,
      "Too many pairing codes. Try again in 10 minutes.",
    );
  return { ...rows[0], code: code.match(/.{4}/g)!.join("-") };
}
const claimSchema = z
  .object({
    code: z
      .string()
      .max(30)
      .transform((v) => v.replace(/[\s-]/g, "").toUpperCase())
      .pipe(z.string().regex(/^[A-F0-9]{16}$/)),
    credential: z.string().regex(/^[a-f0-9]{64}$/),
    name: z.string().trim().min(1).max(60),
    platform: z.literal("android"),
  })
  .strict();
export async function claimOffer(body: unknown) {
  const v = claimSchema.parse(body);
  const hash = digest(v.code),
    credential = digest(v.credential),
    verification = digest(`verify:${v.credential}`).slice(0, 8).toUpperCase();
  const [, rows] = await sql.transaction([
    sql`SELECT id FROM sideby_pairings WHERE selector=${v.code.slice(0, 8)} FOR UPDATE`,
    sql`UPDATE sideby_pairings p SET
      attempts=CASE WHEN p.code_hash<>${hash} THEN attempts+1 ELSE attempts END,
      status=CASE WHEN p.code_hash=${hash} THEN 'pending' ELSE status END,
      credential_hash=CASE WHEN p.code_hash=${hash} THEN ${credential} ELSE credential_hash END,
      device_name=CASE WHEN p.code_hash=${hash} THEN ${v.name} ELSE device_name END,
      verification=CASE WHEN p.code_hash=${hash} THEN ${verification} ELSE verification END
      WHERE selector=${v.code.slice(0, 8)} AND status='offered' AND attempts<5 AND expires_at>now()
      AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=p.child_id AND NOT c.archived)
      RETURNING status,credential_hash,verification`,
    sql`UPDATE sideby_families SET revision=revision+1 WHERE id IN(SELECT c.family_id FROM sideby_children c JOIN sideby_pairings p ON p.child_id=c.id WHERE p.selector=${v.code.slice(0, 8)} AND p.credential_hash=${credential} AND p.status='pending')`,
  ]);
  if (rows[0]?.credential_hash === credential)
    return { status: "pending", verification };
  // A lost response can be retried by the same installation, never by another one.
  const [retry] =
    await sql`SELECT p.status,p.verification FROM sideby_pairings p JOIN sideby_children c ON c.id=p.child_id WHERE selector=${v.code.slice(0, 8)} AND code_hash=${hash} AND credential_hash=${credential} AND status IN ('pending','approved') AND expires_at>now() AND NOT c.archived AND (status='pending' OR EXISTS(SELECT 1 FROM sideby_devices d WHERE d.pairing_id=p.id AND d.revoked_at IS NULL AND d.credential_expires_at>now()))`;
  if (retry) return retry;
  throw new HttpError(
    404,
    "Pairing code unavailable. Ask the parent for a new code.",
  );
}
export async function decideOffer(
  childId: string,
  familyId: string,
  id: string,
  action: "approve" | "cancel",
) {
  const [, rows] = await sql.transaction([
    sql`SELECT id FROM sideby_children WHERE id=${childId} FOR UPDATE`,
    action === "approve"
      ? sql`WITH accepted AS (
          UPDATE sideby_pairings p SET status='approved' WHERE child_id=${childId} AND id=${id} AND status='pending' AND expires_at>now()
          AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=p.child_id AND NOT c.archived)
          RETURNING id,child_id,device_name,credential_hash
        ) INSERT INTO sideby_devices(child_id,pairing_id,name,credential_hash) SELECT child_id,id,device_name,credential_hash FROM accepted RETURNING id`
      : sql`UPDATE sideby_pairings SET status='cancelled' WHERE child_id=${childId} AND id=${id} AND status IN ('offered','pending','cancelled') RETURNING id`,
    sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${familyId}`,
  ]);
  if (!rows.length && action === "approve") {
    const [existing] =
      await sql`SELECT d.id FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE d.pairing_id=${id} AND d.child_id=${childId} AND d.revoked_at IS NULL AND NOT c.archived`;
    if (existing) return;
  }
  if (!rows.length)
    throw new HttpError(
      409,
      "This pairing changed or expired. Refresh and try again.",
    );
}
export async function heartbeat(req: Request) {
  const token = req.headers
    .get("authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401, "Device is not authorized.");
  const [row] =
    await sql`UPDATE sideby_devices d SET last_seen_at=now() WHERE credential_hash=${digest(token)} AND revoked_at IS NULL AND credential_expires_at>now() AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=d.child_id AND NOT c.archived) RETURNING id,last_seen_at AS server_time`;
  if (!row) throw new HttpError(401, "Device is not authorized.");
  return { ...row, status: "connected" };
}

export async function reportPermissions(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401, "Device is not authorized.");
  const report = permissionReportSchema.parse(await smallBody(req));
  const [row] = await sql`UPDATE sideby_devices d
    SET permission_report=${JSON.stringify(report)}::jsonb,permissions_updated_at=now(),
    usage_report=CASE WHEN ${report.permissions.usage}='granted' THEN usage_report ELSE NULL END,
    content_reports=(SELECT COALESCE(jsonb_object_agg(key,CASE
      WHEN key IN ('contacts','notifications','sms','calls') AND COALESCE(${JSON.stringify(report.permissions)}::jsonb->>(CASE WHEN key='calls' THEN 'call_history' ELSE key END),'')<>'granted'
      THEN value || jsonb_build_object('status','no_permission','items','[]'::jsonb,'omitted',0) ELSE value END),'{}'::jsonb) FROM jsonb_each(d.content_reports))
    WHERE credential_hash=${digest(token)} AND revoked_at IS NULL AND credential_expires_at>now()
    AND EXISTS(SELECT 1 FROM sideby_children c WHERE c.id=d.child_id AND NOT c.archived)
    RETURNING permissions_updated_at AS received_at`;
  if (!row) throw new HttpError(401, "Device is not authorized.");
  return {status: "received", ...row};
}
