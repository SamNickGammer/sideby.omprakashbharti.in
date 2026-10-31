import {
  authenticated,
  ApiError,
  body,
  endpoint,
  origin,
  response,
  sql,
} from "../../../../lib/core";
import { uuid } from "../../../../lib/schema";
import { z } from "zod";
export async function PATCH(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    origin(r);
    await authenticated();
    const id = uuid.parse((await params).id),
      v = z
        .object({ status: z.enum(["open", "investigating", "resolved"]) })
        .strict()
        .parse(await body(r, 1024));
    const rows =
      await sql()`WITH changed AS (UPDATE sideby_bug_reports SET status=${v.status},updated_at=now() WHERE id=${id} RETURNING id), audit AS (INSERT INTO sideby_admin_audit(action,resource_id) SELECT ${"bug." + v.status},id FROM changed) SELECT id FROM changed`;
    if (!rows.length) throw new ApiError(404, "Report not found.");
    return response({ ok: true });
  });
}
