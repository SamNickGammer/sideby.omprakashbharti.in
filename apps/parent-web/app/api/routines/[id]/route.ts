import {
  identity,
  handle,
  json,
  family,
  HttpError,
} from "../../../../lib/http";
import { sql } from "../../../../lib/db";
import { routineSchema, idSchema } from "../../../../lib/validation";
export const PATCH = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const u = await identity(req);
    const f = await family(u.id);
    const id = idSchema.parse((await ctx.params).id);
    const v = routineSchema.parse(await req.json());
    const [rows] = await sql.transaction([
      sql`UPDATE sideby_routines SET name=${v.name},start_time=${v.start_time},end_time=${v.end_time},days=${v.days},enabled=${v.enabled} WHERE id=${id} AND family_id=${f.id} RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
    ]);
    if (!rows.length) throw new HttpError(404, "Routine not found.");
    return json({ ok: true });
  });
export const DELETE = (
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) =>
  handle(async () => {
    const u = await identity(req);
    const f = await family(u.id);
    const id = idSchema.parse((await ctx.params).id);
    const [rows] = await sql.transaction([
      sql`DELETE FROM sideby_routines WHERE id=${id} AND family_id=${f.id} RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
    ]);
    if (!rows.length) throw new HttpError(404, "Routine not found.");
    return json({ ok: true });
  });
