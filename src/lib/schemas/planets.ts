// Shared Zod schema for the 9 Planets Analysis form.
// PRD §6.2. Same structural shape as the chakra schema (profile +
// fixed-length scored rows + free-text summary), just keyed on the
// nine planets instead of seven chakras.

import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { PLANETS } from "@/constants/planets";

const planetKeys = PLANETS.map((p) => p.key) as [string, ...string[]];

const planetRowSchema = z.object({
  key: z.enum(planetKeys),
  score: z
    .number()
    .int()
    .min(-50, "Score must be -50 or higher")
    .max(50, "Score must be 50 or lower"),
  implication: z
    .string()
    .trim()
    .max(2000, "Keep recommendation under 2000 chars"),
});

export const planetsEntrySchema = z.object({
  profile: profileSchema,
  rows: z.array(planetRowSchema).length(9, "Expected exactly 9 planet rows"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type PlanetsEntryPayload = z.infer<typeof planetsEntrySchema>;
export type PlanetRowData = z.infer<typeof planetRowSchema>;
