import { handle, json } from "../../../../lib/http";
import { claimOffer, smallBody } from "../../../../lib/pairing";
export const POST = (req: Request) =>
  handle(async () => json(await claimOffer(await smallBody(req))));
