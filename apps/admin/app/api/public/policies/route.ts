import { ApiError, endpoint, response, sql } from "../../../../lib/core";
import { slug, uuid } from "../../../../lib/schema";
export async function GET(r: Request) {
  return endpoint(async () => {
    const params = new URL(r.url).searchParams,
      s = slug.parse(params.get("slug")),
      id = params.get("version");
    if (id) uuid.parse(id);
    const db = sql();
    const versions =
      await db`SELECT id,title,summary,effective_date::text AS effective_date,published_at FROM sideby_policy_versions WHERE slug=${s} AND published_at IS NOT NULL ORDER BY published_at DESC LIMIT 200`;
    const rows = id
      ? await db`SELECT id,slug,title,body,summary,effective_date::text AS effective_date,published_at FROM sideby_policy_versions WHERE id=${id} AND slug=${s} AND published_at IS NOT NULL`
      : await db`SELECT v.id,v.slug,v.title,v.body,v.summary,v.effective_date::text AS effective_date,v.published_at FROM sideby_policy_versions v JOIN sideby_policy_current c ON c.version_id=v.id WHERE c.slug=${s} AND v.published_at IS NOT NULL`;
    if (!rows.length)
      throw new ApiError(404, "No published policy version is available.");
    return response({ policy: rows[0], versions }, 200, true);
  }, true);
}
