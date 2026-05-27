// Authoritative planet data per PRD §6.2.
// Order is the form-display order (Sun → Ketu).

export const PLANETS = [
  { key: "sun",     label: "Sun",     sanskrit: "Surya",   color: "#F39C12" },
  { key: "moon",    label: "Moon",    sanskrit: "Chandra", color: "#5DADE2" },
  { key: "mars",    label: "Mars",    sanskrit: "Mangal",  color: "#C0392B" },
  { key: "mercury", label: "Mercury", sanskrit: "Budh",    color: "#16A085" },
  { key: "jupiter", label: "Jupiter", sanskrit: "Guru",    color: "#D4AC0D" },
  { key: "venus",   label: "Venus",   sanskrit: "Shukra",  color: "#E91E63" },
  { key: "saturn",  label: "Saturn",  sanskrit: "Shani",   color: "#6C3483" },
  { key: "rahu",    label: "Rahu",    sanskrit: "",        color: "#1C1C1C" },
  { key: "ketu",    label: "Ketu",    sanskrit: "",        color: "#7F8C8D" },
] as const;

export type PlanetKey = (typeof PLANETS)[number]["key"];
