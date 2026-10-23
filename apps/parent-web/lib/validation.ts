import { z } from "zod";
export const idSchema = z.string().uuid();
export const familySchema = z
  .object({ name: z.string().trim().min(1).max(60) })
  .strict();
export const childSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    age: z.number().int().min(1).max(17),
    color: z.enum(["mint", "peach", "lavender", "sky"]),
    daily_limit: z.number().int().min(15).max(720).multipleOf(15),
    archived: z.boolean().optional(),
  })
  .strict();
export const routineSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    days: z.enum(["weekdays", "weekends", "daily"]),
    enabled: z.boolean(),
  })
  .strict()
  .refine((v) => v.start_time !== v.end_time, {
    message: "Choose different start and end times.",
  });
