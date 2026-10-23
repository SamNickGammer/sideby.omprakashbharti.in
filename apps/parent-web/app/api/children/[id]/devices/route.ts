import { identity, handle, json } from "../../../../../lib/http";
import { ownedChild, deviceSnapshot } from "../../../../../lib/pairing";
import { idSchema } from "../../../../../lib/validation";
export const GET = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const u = await identity(req),
      id = idSchema.parse((await ctx.params).id);
    await ownedChild(id, u.id);
    return json(await deviceSnapshot(id));
  });
