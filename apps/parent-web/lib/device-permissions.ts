import { z } from "zod";

export const permissionLabels = {
  internet: "Internet connection",
  camera: "Camera",
  microphone: "Microphone",
  location: "Location",
  notifications: "Notification access",
  usage: "App usage access",
  photos: "Photos",
  contacts: "Contacts",
  sms: "SMS messages",
  call_history: "Call history",
  screen_share: "Screen sharing",
} as const;
export type PermissionKey = keyof typeof permissionLabels;
const grant = z.enum(["granted", "not_granted", "not_available"]);
export const permissionReportSchema = z.object({
  version: z.literal(1),
  app_version: z.string().trim().min(1).max(40),
  android_api: z.number().int().min(26).max(100),
  permissions: z.object({
    internet: grant, camera: grant, microphone: grant, location: grant,
    notifications: grant, usage: grant, photos: grant, contacts: grant,
    sms: grant, call_history: grant,
    screen_share: z.enum(["not_available", "session_required"]),
  }).strict(),
}).strict();
export type PermissionReport = z.infer<typeof permissionReportSchema>;
export const permissionStatusLabels = {
  granted: "Granted", not_granted: "Not allowed", not_available: "Not available in this app",
  session_required: "Consent needed for each session",
} as const;
