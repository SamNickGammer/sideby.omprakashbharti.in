import { handle, json } from "../../../../../lib/http";
import { smallBody } from "../../../../../lib/pairing";
import { idSchema } from "../../../../../lib/validation";
import {
  liveDevice,
  deviceLive,
  deviceLiveSchema,
} from "../../../../../lib/live";
export const POST = (
  req: Request,
  ctx: { params: Promise<{ session: string }> },
) =>
  handle(async () => {
    const device = await liveDevice(req);
    return json(
      await deviceLive(
        device,
        idSchema.parse((await ctx.params).session),
        deviceLiveSchema.parse(await smallBody(req, 4096)),
      ),
    );
  });
