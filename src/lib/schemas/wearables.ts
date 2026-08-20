import { z } from "zod";

import { profileSchema } from "@/lib/schemas/profile";
import { WEARABLE_DEFAULTS } from "@/constants/wearables";

const wearableRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(160, "Keep item name under 160 chars"),
  // One reading per item on a single -50..+50 axis. This replaced a pair of
  // sliders (positiveScore 0..+50 and negativeScore -50..0) that let a single
  // object carry positive AND negative energy at once — which cannot happen.
  score: z
    .number()
    .int()
    .min(-50, "Energy must be between -50 and +50")
    .max(50, "Energy must be between -50 and +50"),
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
