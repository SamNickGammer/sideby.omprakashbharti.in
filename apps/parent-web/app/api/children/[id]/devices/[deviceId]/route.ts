import { identity, handle, json, HttpError } from "../../../../../../lib/http";
import { ownedChild } from "../../../../../../lib/pairing";
import { idSchema } from "../../../../../../lib/validation";
import { sql } from "../../../../../../lib/db";
export const DELETE = (
  req: Request,
  ctx: { params: Promise<{ id: string; deviceId: string }> },
) =>
  handle(async () => {
    const u = await identity(req),
      p = await ctx.params,
      id = idSchema.parse(p.id),
      deviceId = idSchema.parse(p.deviceId),
      c = await ownedChild(id, u.id);
    const [rows] = await sql.transaction([
      sql`UPDATE sideby_devices SET revoked_at=COALESCE(revoked_at,now()),usage_report=NULL WHERE id=${deviceId} AND child_id=${id} RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${c.family_id}`,
    ]);
    if (!rows.length) throw new HttpError(404, "Device not found.");
    return json({ ok: true });
  });
