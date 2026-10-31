import { z } from "zod";
import { handle, json } from "../../../../lib/http";
import { smallBody } from "../../../../lib/pairing";
import { liveDevice, pollDevice } from "../../../../lib/live";
export const POST = (req: Request) =>
  handle(async () => {
    const device = await liveDevice(req);
    z.object({ action: z.literal("poll") })
      .strict()
      .parse(await smallBody(req, 4096));
    return json(await pollDevice(device));
  });
