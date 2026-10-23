import { identity, handle, json, family } from "../../../lib/http";
import { sql } from "../../../lib/db";
import { childSchema } from "../../../lib/validation";
export const POST = (req: Request) =>
  handle(async () => {
    const u = await identity(req);
    const f = await family(u.id);
    const v = childSchema.parse(await req.json());
    const [rows] = await sql.transaction([
      sql`INSERT INTO sideby_children(family_id,name,age,color,daily_limit) VALUES(${f.id},${v.name},${v.age},${v.color},${v.daily_limit}) RETURNING id`,
      sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
    ]);
    return json({ id: rows[0].id }, 201);
  });
