// Life Challenges Zod schema. PRD §6.4.
// Rows are dynamic: 1..12 entries, each with an admin-typed label,
// severity score, and implication.

import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { LIFE_CHALLENGE_DEFAULTS } from "@/constants/life-challenges";

const challengeRowSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Challenge name is required")
    .max(160, "Keep challenge name under 160 chars"),
  score: z
    .number()
    .int()
    .min(-50, "Severity must be between -50 and +50")
    .max(50, "Severity must be between -50 and +50"),
  implication: z
    .string()
    .trim()
    .max(2000, "Keep implication under 2000 chars"),
});

export const lifeChallengesEntrySchema = z.object({
  profile: profileSchema,
  rows: z
    .array(challengeRowSchema)
    .min(LIFE_CHALLENGE_DEFAULTS.minRows, "At least one challenge is required")
    .max(
      LIFE_CHALLENGE_DEFAULTS.maxRows,
      `At most ${LIFE_CHALLENGE_DEFAULTS.maxRows} challenges allowed`
    ),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type LifeChallengesEntryPayload = z.infer<typeof lifeChallengesEntrySchema>;
export type LifeChallengeRowData = z.infer<typeof challengeRowSchema>;
