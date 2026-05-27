// Life Challenges form per PRD §6.4. Unlike the other forms, rows are
// not preset — the admin types each challenge name. Rows start at 7 and
// can grow to 12 (the PRD-specified cap).
//
// LIFE_CHALLENGE_COLORS is the rotation palette used to give each row
// a unique-looking bar/swatch so the report doesn't feel visually
// monotonous. Chosen from a "mountain path" mood (PRD's dashboard icon).

export const LIFE_CHALLENGE_DEFAULTS = {
  initialRows: 7,
  maxRows: 12,
  minRows: 1,
} as const;

export const LIFE_CHALLENGE_COLORS = [
  "#8E44AD", // violet
  "#D35400", // burnt orange
  "#2E86C1", // steel blue
  "#16A085", // teal
  "#C0392B", // deep red
  "#7D6608", // olive
  "#566573", // slate
  "#922B21", // brick
  "#1E8449", // forest green
  "#6C3483", // dark violet
  "#B7950B", // mustard
  "#34495E", // navy
] as const;

export function colorForLifeChallengeRow(idx: number): string {
  return LIFE_CHALLENGE_COLORS[idx % LIFE_CHALLENGE_COLORS.length];
}
