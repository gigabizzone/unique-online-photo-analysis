// Dynamic branding accessor. Reads admin-editable strings (slogans + tagline)
// from the Settings table; falls back to the static defaults in
// src/constants/branding.ts.
//
// Cached in module scope for the lifetime of the Node process. Phase 12.3's
// PUT /api/settings calls clearBrandingCache() after a successful write so
// the next read picks up the change.

import { prisma } from "@/lib/db";
import { BRAND as STATIC_BRAND } from "@/constants/branding";

export interface BrandingOverrides {
  sloganEn: string;
  sloganHi: string;
  tagline: string;
}

export interface FullBranding {
  appName: string;
  brand: string;
  sloganEn: string;
  sloganHi: string;
  tagline: string;
  legalDisclaimer: string;
}

let cached: FullBranding | null = null;

export function clearBrandingCache(): void {
  cached = null;
}

/**
 * Returns the current branding strings, merging the editable Settings row
 * with the static defaults. Safe to call from server components, API
 * routes, PDF generators, the mailer, and the WhatsApp link builder.
 */
export async function getBranding(): Promise<FullBranding> {
  if (cached) return cached;
  try {
    const row = await prisma.settings.findUnique({ where: { id: "main" } });
    cached = {
      appName: STATIC_BRAND.appName,
      brand: STATIC_BRAND.brand,
      sloganEn: row?.sloganEn ?? STATIC_BRAND.sloganEn,
      sloganHi: row?.sloganHi ?? STATIC_BRAND.sloganHi,
      tagline: row?.tagline ?? STATIC_BRAND.tagline,
      legalDisclaimer: STATIC_BRAND.legalDisclaimer,
    };
  } catch (err) {
    console.error("getBranding: DB read failed, falling back to constants", err);
    cached = { ...STATIC_BRAND };
  }
  return cached;
}

/**
 * Upsert the Settings row with new values. Caller is responsible for
 * having already validated the inputs. Clears the in-memory cache.
 */
export async function updateBranding(
  overrides: BrandingOverrides
): Promise<FullBranding> {
  await prisma.settings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      sloganEn: overrides.sloganEn,
      sloganHi: overrides.sloganHi,
      tagline: overrides.tagline,
    },
    update: {
      sloganEn: overrides.sloganEn,
      sloganHi: overrides.sloganHi,
      tagline: overrides.tagline,
    },
  });
  clearBrandingCache();
  return getBranding();
}
