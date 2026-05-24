// Authoritative branding constants for Aura Photo Science.
// Single source of truth used by the dashboard, login, emails, PDF reports,
// and the public report page. PRD v3.0 §3.

export const BRAND = {
  appName: "Unique Online Photo Analysis",
  brand: "Aura Photo Science",
  sloganEn: "World's first-of-its-kind online service",
  sloganHi: "विश्व में अपनी तरह की पहली ऑनलाइन सेवा।",
  tagline: "AT AURA PHOTO SCIENCE – WE TRANSFORM YOUR LIFE.",
  legalDisclaimer:
    "This report is for personal insight and wellness purposes only.",
} as const;

export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/auraphotoscience",
    handle: "facebook.com/auraphotoscience",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/auraphotoscience/",
    handle: "instagram.com/auraphotoscience",
  },
  {
    name: "Pinterest",
    url: "https://in.pinterest.com/auraphotoscience/",
    handle: "in.pinterest.com/auraphotoscience",
  },
  {
    name: "Website",
    url: "https://www.auraphotoscience.com",
    handle: "www.auraphotoscience.com",
  },
] as const;

// The six analysis types. Order = dashboard tile order (PRD §5.2 table).
// The `prefix` is used in publicId generation per PRD §8.2 (APS-{YYYY}-{PREFIX}-{00000}).
export const ANALYSIS_TYPES = [
  {
    slug: "chakra",
    label: "7 Chakra Analysis",
    blurb: "Crown to Root — energy reading per chakra",
    iconName: "flower2",
    prefix: "CHK",
    dbValue: "CHAKRA",
  },
  {
    slug: "planets",
    label: "9 Planets Analysis",
    blurb: "Sun, Moon, planets, Rahu & Ketu",
    iconName: "orbit",
    prefix: "PLN",
    dbValue: "PLANETS",
  },
  {
    slug: "elements",
    label: "Elements Analysis",
    blurb: "Fire · Earth · Water · Space · Air · Wood · Metal",
    iconName: "sparkles",
    prefix: "ELM",
    dbValue: "ELEMENTS",
  },
  {
    slug: "life-challenges",
    label: "Life Challenges Analysis",
    blurb: "Custom challenges, severity & implications",
    iconName: "mountain",
    prefix: "LCH",
    dbValue: "LIFE_CHALLENGES",
  },
  {
    slug: "overall",
    label: "Overall Analysis",
    blurb: "Positive · Negative · Geopathic stress",
    iconName: "aperture",
    prefix: "OVR",
    dbValue: "OVERALL",
  },
  {
    slug: "wearables",
    label: "Wearable Items Analysis",
    blurb: "Money energy from objects you wear",
    iconName: "gem",
    prefix: "WRB",
    dbValue: "WEARABLES",
  },
] as const;

export type AnalysisType = (typeof ANALYSIS_TYPES)[number];
