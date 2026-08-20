import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { OVERALL_ROWS } from "@/constants/overall";

const overallKeys = OVERALL_ROWS.map((r) => r.key) as [string, ...string[]];

// Per-row valid score range, derived from the constants so the form sliders
// and this server-side validation can never drift apart.
const RANGE_BY_KEY = Object.fromEntries(
  OVERALL_ROWS.map((r) => [r.key, { min: r.min, max: r.max }])
) as Record<string, { min: number; max: number }>;

const overallRowSchema = z
  .object({
    key: z.enum(overallKeys),
    score: z.number().int(),
    implication: z
      .string()
      .trim()
      .max(2000, "Keep implication under 2000 chars"),
  })
  .superRefine((row, ctx) => {
    const range = RANGE_BY_KEY[row.key];
    if (!range) return;
    if (row.score < range.min || row.score > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["score"],
        message: `Score for ${row.key} must be between ${range.min} and ${range.max}`,
      });
    }
  });

export const overallEntrySchema = z
  .object({
    profile: profileSchema,
    rows: z.array(overallRowSchema).length(3, "Expected exactly 3 rows"),
    summary: z
      .string()
      .trim()
      .min(1, "Summary is required")
      .max(5000, "Keep summary under 5000 chars"),
  })
  .superRefine((entry, ctx) => {
    // A body scan records EITHER positive or negative energy, never both —
    // a person cannot hold a little of each at the same time. The form
    // disables the opposite field, and this backstops it server-side.
    // Geopathic Stress is environmental and stays independent of the pair.
    const scoreOf = (key: string) =>
      entry.rows.find((r) => r.key === key)?.score ?? 0;

    if (scoreOf("positive_energy") !== 0 && scoreOf("negative_energy") !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rows"],
        message:
          "Enter either Positive Energy or Negative Energy — a single scan cannot record both.",
      });
    }
  });

export type OverallEntryPayload = z.infer<typeof overallEntrySchema>;
export type OverallRowData = z.infer<typeof overallRowSchema>;
