// Wearable Items / Money Energy per PRD §6.6.
// Rows are dynamic (1..10, starts at 3). Each row has TWO sliders —
// a positive-energy slider (0..+50) and a negative-energy slider
// (-50..0). Plus a Money Energy Impact textarea per row.
//
// The form also has a separate "Remarks / Recommendations" section
// with exactly 5 numbered text inputs at the bottom.

export const WEARABLE_DEFAULTS = {
  initialRows: 3,
  maxRows: 10,
  minRows: 1,
  remarksCount: 5,
} as const;

export const POSITIVE_COLOR = "#2ECC71"; // green for positive-energy bar
export const NEGATIVE_COLOR = "#E74C3C"; // red for negative-energy bar

export const WEARABLE_ITEM_COLORS = [
  "#D4A24C", // brand gold
  "#9B59B6",
  "#2E86C1",
  "#E67E22",
  "#16A085",
  "#C0392B",
  "#7D6608",
  "#566573",
  "#6C3483",
  "#1E8449",
] as const;

export function colorForWearableRow(idx: number): string {
  return WEARABLE_ITEM_COLORS[idx % WEARABLE_ITEM_COLORS.length];
}
