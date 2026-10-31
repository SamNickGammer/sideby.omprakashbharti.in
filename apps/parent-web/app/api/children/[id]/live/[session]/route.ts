import { handle, identity, json } from "../../../../../../lib/http";
import { ownedChild, smallBody } from "../../../../../../lib/pairing";
import { idSchema } from "../../../../../../lib/validation";
import { parentLive, parentLiveSchema } from "../../../../../../lib/live";
export const POST = (
  req: Request,
  ctx: { params: Promise<{ id: string; session: string }> },
) =>
  handle(async () => {
    const u = await identity(req),
      p = await ctx.params,
      id = idSchema.parse(p.id);
    await ownedChild(id, u.id);
    return json(
      await parentLive(
        id,
        idSchema.parse(p.session),
        parentLiveSchema.parse(await smallBody(req, 4096)),
      ),
    );
  });
