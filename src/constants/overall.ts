// Overall Analysis rows per PRD §6.5. Three fixed dimensions.
// Colours: positive = soft green, negative = soft red, geopathic = stone.

export const OVERALL_ROWS = [
  {
    key: "positive_energy",
    label: "Positive Energy",
    sanskrit: "",
    color: "#2ECC71",
  },
  {
    key: "negative_energy",
    label: "Negative Energy",
    sanskrit: "",
    color: "#E74C3C",
  },
  {
    key: "geopathic_stress",
    label: "Geopathic Stress",
    sanskrit: "",
    color: "#6C3483",
  },
] as const;

export type OverallKey = (typeof OVERALL_ROWS)[number]["key"];
