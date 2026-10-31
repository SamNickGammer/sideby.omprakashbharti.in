import {
  authenticated,
  body,
  endpoint,
  origin,
  response,
  sql,
} from "../../../lib/core";
import { policy } from "../../../lib/schema";
export async function GET() {
  return endpoint(async () => {
    await authenticated();
    return response({
      versions:
        await sql()`SELECT v.id,v.slug,v.title,v.body,v.summary,v.effective_date::text AS effective_date,v.created_at,v.published_at,c.version_id=v.id AS current FROM sideby_policy_versions v LEFT JOIN sideby_policy_current c ON c.slug=v.slug ORDER BY created_at DESC LIMIT 100`,
    });
  });
}
export async function POST(r: Request) {
  return endpoint(async () => {
    origin(r);
    await authenticated();
    const v = policy.parse(await body(r));
    const rows =
      await sql()`WITH version AS (INSERT INTO sideby_policy_versions(slug,title,body,summary,effective_date) VALUES (${v.slug},${v.title},${v.body},${v.summary},${v.effectiveDate}) RETURNING *) , audit AS (INSERT INTO sideby_admin_audit(action,resource_id) SELECT 'policy.create',id FROM version) SELECT id,slug,title,body,summary,effective_date::text AS effective_date,created_at,published_at FROM version`;
    return response({ version: rows[0] }, 201);
  });
}
