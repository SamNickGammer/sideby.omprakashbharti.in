import { authenticated, endpoint, response, sql } from "../../../lib/core";
export async function GET() {
  return endpoint(async () => {
    await authenticated();
    const db = sql();
    const tables =
      await db`SELECT to_regclass('public.sideby_families') IS NOT NULL AS families,to_regclass('public.sideby_children') IS NOT NULL AS children,to_regclass('public.sideby_devices') IS NOT NULL AS devices,to_regclass('neon_auth."user"') IS NOT NULL AS users`;
    const available = tables[0];
    if (!Object.values(available).every(Boolean))
      return response({
        available: false,
        environment: process.env.NEON_BRANCH || "unconfigured",
        message:
          "Platform metrics are unavailable until the parent database schema is configured.",
      });
    const [counts, growth] = await Promise.all([
      db`SELECT (SELECT count(*)::int FROM neon_auth."user") AS users,(SELECT count(*)::int FROM sideby_families) AS families,(SELECT count(*)::int FROM sideby_children WHERE NOT archived) AS children,(SELECT count(*)::int FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE NOT c.archived AND d.revoked_at IS NULL AND d.credential_expires_at>now()) AS devices,(SELECT count(*)::int FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE NOT c.archived AND d.revoked_at IS NULL AND d.credential_expires_at>now() AND d.last_seen_at>now()-interval '24 hours') AS recent`,
      db`SELECT day::date::text AS day,(SELECT count(*)::int FROM neon_auth."user" u WHERE u."createdAt">=day AND u."createdAt"<day+interval '1 day') AS users,(SELECT count(*)::int FROM sideby_children c WHERE c.created_at>=day AND c.created_at<day+interval '1 day') AS children,(SELECT count(*)::int FROM sideby_devices d WHERE d.created_at>=day AND d.created_at<day+interval '1 day') AS devices FROM generate_series(CURRENT_DATE-29,CURRENT_DATE,interval '1 day') day ORDER BY day`,
    ]);
    return response({
      available: true,
      environment: process.env.NEON_BRANCH || "unconfigured",
      counts: counts[0],
      growth,
      asOf: new Date().toISOString(),
    });
  });
}
