import { handle, identity, json } from "../../../../../lib/http";
import { ownedChild, smallBody } from "../../../../../lib/pairing";
import { idSchema } from "../../../../../lib/validation";
import {
  liveSnapshot,
  startLive,
  startLiveSchema,
} from "../../../../../lib/live";
type C = { params: Promise<{ id: string }> };
export const GET = (req: Request, ctx: C) =>
  handle(async () => {
    const u = await identity(req),
      id = idSchema.parse((await ctx.params).id);
    await ownedChild(id, u.id);
    return json(await liveSnapshot(id));
  });
export const POST = (req: Request, ctx: C) =>
  handle(async () => {
    const u = await identity(req),
      id = idSchema.parse((await ctx.params).id);
    await ownedChild(id, u.id);
    return json(
      await startLive(id, startLiveSchema.parse(await smallBody(req, 4096))),
      201,
    );
  });
