import { z } from "zod";
import { identity, handle, json } from "../../../../../lib/http";
import {
  ownedChild,
  createOffer,
  decideOffer,
  smallBody,
} from "../../../../../lib/pairing";
import { idSchema } from "../../../../../lib/validation";
type Context = { params: Promise<{ id: string }> };
export const POST = (req: Request, ctx: Context) =>
  handle(async () => {
    const u = await identity(req),
      id = idSchema.parse((await ctx.params).id),
      c = await ownedChild(id, u.id, true);
    return json(await createOffer(id, c.family_id), 201);
  });
export const PATCH = (req: Request, ctx: Context) =>
  handle(async () => {
    const u = await identity(req),
      id = idSchema.parse((await ctx.params).id),
      c = await ownedChild(id, u.id, true);
    const v = z
      .object({ id: idSchema, action: z.enum(["approve", "cancel"]) })
      .strict()
      .parse(await smallBody(req));
    await decideOffer(id, c.family_id, v.id, v.action);
    return json({ ok: true });
  });
