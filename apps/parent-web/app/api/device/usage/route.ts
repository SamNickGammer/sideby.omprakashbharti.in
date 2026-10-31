import { handle,json } from "../../../../lib/http";
import { receiveUsage } from "../../../../lib/usage";
export const POST=(req:Request)=>handle(async()=>json(await receiveUsage(req)));
