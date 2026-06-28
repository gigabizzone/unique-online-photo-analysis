// Free Basic Aura Check rows (formerly "Overall Analysis"). Three fixed
// dimensions, each with its own valid score range:
//   - Positive Energy : 0 .. +50  (always non-negative, green)
//   - Negative Energy : 0 .. +50  (always non-negative, always RED)
//   - Geopathic Stress: -50 .. 0  (always non-positive, stone/purple)

export const OVERALL_ROWS = [
  {
    key: "positive_energy",
    label: "Positive Energy",
    sanskrit: "",
    color: "#2ECC71",
    min: 0,
    max: 50,
  },
  {
    key: "negative_energy",
    label: "Negative Energy",
    sanskrit: "",
    color: "#E74C3C",
    min: 0,
    max: 50,
  },
  {
    key: "geopathic_stress",
    label: "Geopathic Stress",
    sanskrit: "",
    color: "#6C3483",
    min: -50,
    max: 0,
  },
] as const;

export type OverallKey = (typeof OVERALL_ROWS)[number]["key"];

// Per-row score range keyed by row key. Used to enrich stored report rows
// (which only persist key/label/color/score/implication) so the PDF and
// public report can draw each bar on its true axis — even for entries saved
// before per-row ranges existed.
export const OVERALL_RANGE_BY_KEY: Record<
  string,
  { min: number; max: number }
> = Object.fromEntries(
  OVERALL_ROWS.map((r) => [r.key, { min: r.min, max: r.max }])
);
