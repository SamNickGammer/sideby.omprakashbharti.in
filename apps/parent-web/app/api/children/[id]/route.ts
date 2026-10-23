import {
  identity,
  handle,
  json,
  family,
  HttpError,
} from "../../../../lib/http";
import { sql } from "../../../../lib/db";
import { childSchema, idSchema } from "../../../../lib/validation";
export const PATCH = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const u = await identity(req);
    const f = await family(u.id);
    const id = idSchema.parse((await ctx.params).id);
    const v = childSchema.parse(await req.json());
    const [rows] = await sql.transaction([
      sql`UPDATE sideby_children SET name=${v.name},age=${v.age},color=${v.color},archived=${v.archived ?? false} WHERE id=${id} AND family_id=${f.id} RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
    ]);
    if (!rows.length) throw new HttpError(404, "Child profile not found.");
    return json({ ok: true });
  });
