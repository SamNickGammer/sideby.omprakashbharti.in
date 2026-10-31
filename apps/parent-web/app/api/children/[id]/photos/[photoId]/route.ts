import { handle,identity } from "../../../../../../lib/http";
import { ownedChild } from "../../../../../../lib/pairing";
import { idSchema } from "../../../../../../lib/validation";
import { readPhoto } from "../../../../../../lib/device-content";
export const GET=(req:Request,ctx:{params:Promise<{id:string;photoId:string}>})=>handle(async()=>{
 const user=await identity(req),p=await ctx.params,id=idSchema.parse(p.id);await ownedChild(id,user.id);return readPhoto(id,idSchema.parse(p.photoId));
});
