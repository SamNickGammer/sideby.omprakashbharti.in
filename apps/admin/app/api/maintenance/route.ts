import { timingSafeEqual } from "node:crypto";
import { endpoint, response, required, sql, ApiError } from "../../../lib/core";
export async function GET(r: Request) {
  return endpoint(async () => {
    const actual = Buffer.from(r.headers.get("authorization") || ""),
      expected = Buffer.from("Bearer " + required("CRON_SECRET"));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new ApiError(401, "Unauthorized");
    const db = sql();
    await db.transaction([
      db`DELETE FROM sideby_bug_reports WHERE created_at<now()-interval '180 days'`,
      db`DELETE FROM sideby_admin_sessions WHERE expires_at<now()`,
      db`DELETE FROM sideby_admin_limits WHERE expires_at<now()`,
    ]);
    return response({ ok: true });
  });
}
