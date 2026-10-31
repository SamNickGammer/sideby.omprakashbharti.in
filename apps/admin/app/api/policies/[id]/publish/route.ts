import {
  authenticated,
  ApiError,
  endpoint,
  origin,
  response,
  sql,
} from "../../../../../lib/core";
import { uuid } from "../../../../../lib/schema";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    origin(r);
    await authenticated();
    const id = uuid.parse((await params).id);
    const rows =
      await sql()`WITH version AS (UPDATE sideby_policy_versions SET published_at=now() WHERE id=${id} AND published_at IS NULL AND effective_date<=(now() AT TIME ZONE 'Asia/Kolkata')::date RETURNING *), current AS (INSERT INTO sideby_policy_current(slug,version_id) SELECT slug,id FROM version ON CONFLICT(slug) DO UPDATE SET version_id=EXCLUDED.version_id), audit AS (INSERT INTO sideby_admin_audit(action,resource_id) SELECT 'policy.publish',id FROM version) SELECT id FROM version`;
    if (!rows.length)
      throw new ApiError(
        409,
        "Already published, missing, or effective date is in the future.",
      );
    return response({ ok: true });
  });
}
