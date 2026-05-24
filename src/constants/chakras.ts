// Authoritative chakra data per PRD §3.5 and §6.1.
// Order is top-to-bottom as it must appear in the entry form
// (Crown → Third Eye → Throat → Heart → Solar Plexus → Sacral → Root).

export const CHAKRAS = [
  {
    key: "crown",
    label: "Crown Chakra",
    sanskrit: "Sahasrara",
    color: "#8E44AD", // Violet
  },
  {
    key: "third_eye",
    label: "Third Eye Chakra",
    sanskrit: "Ajna",
    color: "#4B0082", // Indigo
  },
  {
    key: "throat",
    label: "Throat Chakra",
    sanskrit: "Vishuddha",
    color: "#1E90FF", // Blue
  },
  {
    key: "heart",
    label: "Heart Chakra",
    sanskrit: "Anahata",
    color: "#2ECC71", // Green
  },
  {
    key: "solar_plexus",
    label: "Solar Plexus Chakra",
    sanskrit: "Manipura",
    color: "#F1C40F", // Yellow
  },
  {
    key: "sacral",
    label: "Sacral Chakra",
    sanskrit: "Svadhisthana",
    color: "#E67E22", // Orange
  },
  {
    key: "root",
    label: "Root Chakra",
    sanskrit: "Muladhara",
    color: "#E74C3C", // Red
  },
] as const;

export type ChakraKey = (typeof CHAKRAS)[number]["key"];
