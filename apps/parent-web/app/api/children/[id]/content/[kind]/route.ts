import { handle,identity,json } from "../../../../../../lib/http";
import { ownedChild } from "../../../../../../lib/pairing";
import { idSchema } from "../../../../../../lib/validation";
import { kindSchema } from "../../../../../../lib/content-contract";
import { contentSnapshot,clearContent } from "../../../../../../lib/device-content";
type Context={params:Promise<{id:string;kind:string}>};
export const GET=(req:Request,ctx:Context)=>handle(async()=>{
 const user=await identity(req),p=await ctx.params,id=idSchema.parse(p.id),kind=kindSchema.parse(p.kind);
 await ownedChild(id,user.id);return json(await contentSnapshot(id,kind));
});
export const DELETE=(req:Request,ctx:Context)=>handle(async()=>{
 const user=await identity(req),p=await ctx.params,id=idSchema.parse(p.id),kind=kindSchema.parse(p.kind);
 await ownedChild(id,user.id);await clearContent(id,idSchema.parse(new URL(req.url).searchParams.get("device")),kind);return json({ok:true});
});
