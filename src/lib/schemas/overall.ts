import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { OVERALL_ROWS } from "@/constants/overall";

const overallKeys = OVERALL_ROWS.map((r) => r.key) as [string, ...string[]];

const overallRowSchema = z.object({
  key: z.enum(overallKeys),
  score: z
    .number()
    .int()
    .min(-50, "Score must be -50 or higher")
    .max(50, "Score must be 50 or lower"),
  implication: z
    .string()
    .trim()
    .max(2000, "Keep implication under 2000 chars"),
});

export const overallEntrySchema = z.object({
  profile: profileSchema,
  rows: z.array(overallRowSchema).length(3, "Expected exactly 3 rows"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type OverallEntryPayload = z.infer<typeof overallEntrySchema>;
export type OverallRowData = z.infer<typeof overallRowSchema>;
