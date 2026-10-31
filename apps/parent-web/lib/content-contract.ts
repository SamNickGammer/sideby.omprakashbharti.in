import { z } from "zod";
export const kinds = ["apps", "notifications", "contacts", "sms", "calls", "photos"] as const;
export const kindSchema = z.enum(kinds);
export type ContentKind = typeof kinds[number];
const id = z.string().min(1).max(255);
const text = (max: number) => z.string().max(max);
const time = z.string().datetime();
const packageName = z.string().max(255).regex(/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/);
const schemas = {
  apps: z.object({id:packageName,name:text(120),version:text(80),system:z.boolean()}).strict(),
  contacts: z.object({id,name:text(120),number:text(80)}).strict(),
  notifications: z.object({id,package:packageName,app:text(120),title:text(160),text:text(500),time,redacted:z.boolean()}).strict(),
  sms: z.object({id,address:text(80),body:text(500),time,direction:z.enum(["incoming","outgoing","other"])}).strict(),
  calls: z.object({id,number:text(80),type:z.enum(["incoming","outgoing","missed","other"]),duration:z.number().int().min(0).max(604800),time}).strict(),
  photos: z.object({id:z.string().uuid(),image:z.string().min(4).max(900*1024).regex(/^[A-Za-z0-9+/]+={0,2}$/)}).strict(),
};
export const limits: Record<ContentKind,number> = {apps:500,contacts:200,notifications:100,sms:100,calls:100,photos:3};
export const permissions: Partial<Record<ContentKind,string>> = {contacts:"contacts",notifications:"notifications",sms:"sms",calls:"call_history"};
export function contentSchema(kind:ContentKind) {
  return z.object({version:z.literal(1),status:z.enum(["ready","disabled","no_permission","unavailable"]),generated_at:time,
    items:z.array(schemas[kind]).max(limits[kind]),omitted:z.number().int().min(0).max(100000)
  }).strict().superRefine((r,c)=>{
    const fail=(message:string)=>c.addIssue({code:"custom",message});
    const at=Date.parse(r.generated_at),now=Date.now();
    if(at>now+300000||at<now-48*3600000)fail("Invalid sample time.");
    if(r.status!=="ready"&&(r.items.length||r.omitted))fail("Non-ready reports must be empty.");
    if(new Set(r.items.map(i=>i.id)).size!==r.items.length)fail("Duplicate item IDs.");
    for(const item of r.items)if("time" in item) {
      const t=Date.parse(item.time),window=kind==="notifications"?86400000:7*86400000;
      if(t>at+300000||t<at-window)fail("Event is outside the sharing window.");
    }
  });
}
export type ContentItem = Record<string,string|number|boolean>;
export type ContentReport = {version:1;status:string;generated_at:string;received_at:string;items:ContentItem[];omitted:number};
export type ContentDevice = {id:string;name:string;inactive:boolean;report:ContentReport|null};
