import { handle,json } from "../../../../../lib/http";
import { kindSchema } from "../../../../../lib/content-contract";
import { receiveContent } from "../../../../../lib/device-content";
export const POST=(req:Request,ctx:{params:Promise<{kind:string}>})=>handle(async()=>json(await receiveContent(req,kindSchema.parse((await ctx.params).kind))));
