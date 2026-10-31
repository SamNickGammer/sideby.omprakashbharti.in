import { z } from "zod";
const datetime = z.string().datetime();
export function localDay(time: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {timeZone: timezone, year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(time);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export const usageReportSchema = z.object({
  version: z.literal(1),
  status: z.enum(["ready","disabled","no_permission","unavailable"]),
  generated_at: datetime,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).max(80),
  period_start: datetime,
  apps: z.array(z.object({
    package_name: z.string().regex(/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/).max(255),
    name: z.string().trim().min(1).max(80),
    foreground_ms: z.number().int().positive().max(26*3600000),
  }).strict()).max(100),
  omitted_apps: z.number().int().min(0).max(10000),
}).strict().superRefine((v,ctx) => {
  const fail = (message: string) => ctx.addIssue({code:"custom",message});
  const end = Date.parse(v.generated_at), start = Date.parse(v.period_start), now = Date.now();
  if (end > now+300000 || end < now-48*3600000 || start > end || end-start > 26*3600000) fail("Invalid sample period or device clock.");
  try {
    // A local day starts at the first instant bearing that date, including DST midnight gaps.
    if (localDay(start,v.timezone)!==v.day || localDay(start-1,v.timezone)===v.day || localDay(end,v.timezone)!==v.day) fail("Period must begin at local midnight on the sample day.");
  } catch { fail("Invalid timezone."); }
  if (v.status!=="ready" && (v.apps.length || v.omitted_apps)) fail("Unavailable reports must not contain app data.");
  if (new Set(v.apps.map(a=>a.package_name)).size!==v.apps.length) fail("Duplicate packages.");
  if (v.apps.some(a=>a.foreground_ms>end-start)) fail("App duration exceeds sample period.");
});
export type UsageReport = z.infer<typeof usageReportSchema>;
export type UsageDevice = {id:string;name:string;inactive:boolean;report:UsageReport|null;received_at:string|null};
export function duration(ms:number) {
  const seconds = Math.floor(ms/1000);
  if (seconds<60) return `${seconds}s`;
  const minutes = Math.floor(seconds/60);
  return minutes<60 ? `${minutes}m ${seconds%60}s` : `${Math.floor(minutes/60)}h ${minutes%60}m`;
}
