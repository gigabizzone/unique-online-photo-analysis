import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { ELEMENTS } from "@/constants/elements";

const elementKeys = ELEMENTS.map((e) => e.key) as [string, ...string[]];

const elementRowSchema = z.object({
  key: z.enum(elementKeys),
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

export const elementsEntrySchema = z.object({
  profile: profileSchema,
  rows: z.array(elementRowSchema).length(7, "Expected exactly 7 element rows"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type ElementsEntryPayload = z.infer<typeof elementsEntrySchema>;
export type ElementRowData = z.infer<typeof elementRowSchema>;
