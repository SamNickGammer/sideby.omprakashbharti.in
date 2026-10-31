import { handle, json } from "../../../../lib/http";
import { reportPermissions } from "../../../../lib/pairing";
export const POST = (req: Request) => handle(async () => json(await reportPermissions(req)));
