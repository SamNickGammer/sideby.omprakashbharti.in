import { identity, handle, json, family } from "../../../lib/http";
import { sql } from "../../../lib/db";
import { familySchema } from "../../../lib/validation";
export const GET = () =>
  handle(async () => {
    const user = await identity();
    const [f] =
      await sql`SELECT id,name,revision FROM sideby_families WHERE owner_id=${user.id}`;
    if (!f)
      return json({
        user: { id: user.id, name: user.name, email: user.email },
        family: null,
        children: [],
        routines: [],
      });
    const [children, routines] = await Promise.all([
      sql`SELECT id,name,age,color,daily_limit,avatar_key,archived FROM sideby_children WHERE family_id=${f.id} ORDER BY created_at,id`,
      sql`SELECT id,name,start_time,end_time,days,enabled FROM sideby_routines WHERE family_id=${f.id} ORDER BY created_at,id`,
    ]);
    return json({
      user: { id: user.id, name: user.name, email: user.email },
      family: f,
      children,
      routines,
    });
  });
export const POST = (req: Request) =>
  handle(async () => {
    const u = await identity(req);
    const v = familySchema.parse(await req.json());
    await sql`INSERT INTO sideby_families(owner_id,name) VALUES(${u.id},${v.name}) ON CONFLICT(owner_id) DO NOTHING`;
    return json({ ok: true }, 201);
  });
export const PATCH = (req: Request) =>
  handle(async () => {
    const u = await identity(req);
    const v = familySchema.parse(await req.json());
    await family(u.id);
    await sql`UPDATE sideby_families SET name=${v.name},revision=revision+1 WHERE owner_id=${u.id}`;
    return json({ ok: true });
  });
