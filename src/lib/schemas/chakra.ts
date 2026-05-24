// Shared Zod schema for the 7 Chakra Analysis form. Used by the page
// (client-side via RHF) and by the API route (server-side payload check).
// PRD §6.1 + §3.5.

import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { CHAKRAS } from "@/constants/chakras";

const chakraKeys = CHAKRAS.map((c) => c.key) as [string, ...string[]];

const chakraRowSchema = z.object({
  key: z.enum(chakraKeys),
  score: z
    .number()
    .int()
    .min(-50, "Score must be -50 or higher")
    .max(50, "Score must be 50 or lower"),
  implication: z.string().trim().max(2000, "Keep implication under 2000 chars"),
});

export const chakraEntrySchema = z.object({
  profile: profileSchema,
  chakras: z
    .array(chakraRowSchema)
    .length(7, "Expected exactly 7 chakra rows"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type ChakraEntryPayload = z.infer<typeof chakraEntrySchema>;
export type ChakraRowData = z.infer<typeof chakraRowSchema>;
