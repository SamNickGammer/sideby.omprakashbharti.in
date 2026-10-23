import { handle, json } from "../../../../lib/http";
import { heartbeat } from "../../../../lib/pairing";
export const POST = (req: Request) =>
  handle(async () => json(await heartbeat(req)));
