// Elements per PRD §6.3 — five Vedic elements + the two Chinese additions
// (Wood, Metal) for a total of 7. Colours chosen from natural associations
// since the PRD lists only the names + emoji.

export const ELEMENTS = [
  { key: "fire",  label: "Fire",            sanskrit: "Agni",     color: "#E74C3C" },
  { key: "earth", label: "Earth",           sanskrit: "Prithvi",  color: "#A0522D" },
  { key: "water", label: "Water",           sanskrit: "Jal",      color: "#3498DB" },
  { key: "space", label: "Space",           sanskrit: "Akash",    color: "#8E44AD" },
  { key: "air",   label: "Air",             sanskrit: "Vayu",     color: "#95A5A6" },
  { key: "wood",  label: "Wood (Chinese)",  sanskrit: "",         color: "#27AE60" },
  { key: "metal", label: "Metal (Chinese)", sanskrit: "",         color: "#7F8C8D" },
] as const;

export type ElementKey = (typeof ELEMENTS)[number]["key"];
