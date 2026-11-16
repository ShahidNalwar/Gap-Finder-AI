import { z } from "zod";

export const planInputSchema = z.object({
  attemptId: z.string().uuid(),
  days: z.number().int().min(1).max(60),
  hoursPerDay: z.number().positive().max(24),
});
export const revisionPlanSchema = z.object({
  days: z.number(), hoursPerDay: z.number(), totalMinutes: z.number(), unallocatedMinutes: z.number(),
  items: z.array(z.object({
    topicId: z.string(), name: z.string(), mastery: z.number(), priority: z.number(), minutes: z.number(),
    schedule: z.array(z.object({ day: z.number(), minutes: z.number() })),
    tips: z.array(z.string()),
    change: z.object({ previousRank: z.number().nullable(), rankChange: z.number().nullable(), masteryDelta: z.number().nullable() }),
  })),
});
export const savedPlanSchema = z.object({
  id: z.string(), attempt_id: z.string().nullable(), created_at: z.string(),
  days: z.number(), hours_per_day: z.coerce.number(), data: revisionPlanSchema,
});
export type SavedPlan = z.infer<typeof savedPlanSchema>;
