import { identity, handle, json, family } from "../../../lib/http";
import { sql } from "../../../lib/db";
import { routineSchema } from "../../../lib/validation";
export const POST = (req: Request) =>
  handle(async () => {
    const u = await identity(req);
    const f = await family(u.id);
    const v = routineSchema.parse(await req.json());
    const [rows] = await sql.transaction([
      sql`INSERT INTO sideby_routines(family_id,name,start_time,end_time,days,enabled) VALUES(${f.id},${v.name},${v.start_time},${v.end_time},${v.days},${v.enabled}) RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
    ]);
    return json({ id: rows[0].id }, 201);
  });
