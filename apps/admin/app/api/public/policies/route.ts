import { ApiError, endpoint, response, sql } from "../../../../lib/core";
import { slug } from "../../../../lib/schema";
export async function GET(r: Request) {
  return endpoint(async () => {
    const params = new URL(r.url).searchParams,
      s = slug.parse(params.get("slug"));
    if (params.has("version"))
      throw new ApiError(
        400,
        "Historical policies are available by request through Support.",
      );
    const db = sql();
    const rows =
      await db`SELECT v.id,v.slug,v.title,v.body,v.summary,v.effective_date::text AS effective_date,v.published_at FROM sideby_policy_versions v JOIN sideby_policy_current c ON c.version_id=v.id WHERE c.slug=${s} AND v.published_at IS NOT NULL`;
    if (!rows.length)
      throw new ApiError(404, "No published policy version is available.");
    return response({ policy: rows[0] }, 200, true);
  }, true);
}
