import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { WEARABLE_DEFAULTS } from "@/constants/wearables";

const wearableRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(160, "Keep item name under 160 chars"),
  positiveScore: z
    .number()
    .int()
    .min(0, "Positive energy must be 0 or higher")
    .max(50, "Positive energy must be 50 or lower"),
  negativeScore: z
    .number()
    .int()
    .min(-50, "Negative energy must be -50 or higher")
    .max(0, "Negative energy must be 0 or lower"),
  moneyEnergy: z
    .string()
    .trim()
    .max(2000, "Keep money-energy impact under 2000 chars"),
});

export const wearablesEntrySchema = z.object({
  profile: profileSchema,
  rows: z
    .array(wearableRowSchema)
    .min(WEARABLE_DEFAULTS.minRows, "At least one item is required")
    .max(
      WEARABLE_DEFAULTS.maxRows,
      `At most ${WEARABLE_DEFAULTS.maxRows} items allowed`
    ),
  // Exactly 5 remarks slots; blanks are kept (admin may leave some empty)
  remarks: z
    .array(z.string().trim().max(500, "Keep remark under 500 chars"))
    .length(
      WEARABLE_DEFAULTS.remarksCount,
      `Expected ${WEARABLE_DEFAULTS.remarksCount} remarks slots`
    ),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(5000, "Keep summary under 5000 chars"),
});

export type WearablesEntryPayload = z.infer<typeof wearablesEntrySchema>;
export type WearableRowData = z.infer<typeof wearableRowSchema>;
