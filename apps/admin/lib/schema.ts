import { z } from "zod";
export const slug = z.enum(["privacy", "terms", "support"]);
export const policy = z
  .object({
    slug,
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(100).max(60000),
    summary: z.string().trim().min(3).max(1000),
    effectiveDate: z.iso.date(),
  })
  .strict();
export const bug = z
  .object({
    name: z.string().trim().max(100).default(""),
    email: z.email().max(254),
    category: z.enum(["bug", "privacy", "account", "feedback"]),
    subject: z.string().trim().min(3).max(160),
    description: z.string().trim().min(20).max(5000),
    website: z.string().max(200).default(""),
  })
  .strict();
export const credentials = z
  .object({
    email: z.string().trim().min(1).max(254),
    password: z.string().min(1).max(200),
  })
  .strict();
export const uuid = z.uuid();
