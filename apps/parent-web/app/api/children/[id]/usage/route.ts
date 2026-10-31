import { handle,identity,json } from "../../../../../lib/http";
import { ownedChild } from "../../../../../lib/pairing";
import { idSchema } from "../../../../../lib/validation";
import { usageSnapshot } from "../../../../../lib/usage";
export const GET=(req:Request,ctx:{params:Promise<{id:string}>})=>handle(async()=>{
  const user=await identity(req),id=idSchema.parse((await ctx.params).id);
  await ownedChild(id,user.id);
  return json(await usageSnapshot(id));
});
