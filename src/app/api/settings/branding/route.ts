// GET  /api/settings/branding — returns the current editable branding strings
// PUT  /api/settings/branding — updates them (admin only)
//
// PRD §10.3. Slogans + tagline editable; static fields (appName, brand,
// legalDisclaimer) come from src/constants/branding.ts.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getBranding, updateBranding } from "@/lib/branding";

const updateSchema = z.object({
  sloganEn: z
    .string()
    .trim()
    .min(1, "English slogan is required")
    .max(200, "Keep slogan under 200 chars"),
  sloganHi: z
    .string()
    .trim()
    .min(1, "Hindi slogan is required")
    .max(200, "Keep slogan under 200 chars"),
  tagline: z
    .string()
    .trim()
    .min(1, "Tagline is required")
    .max(200, "Keep tagline under 200 chars"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const branding = await getBranding();
  return NextResponse.json({
    sloganEn: branding.sloganEn,
    sloganHi: branding.sloganHi,
    tagline: branding.tagline,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const branding = await updateBranding(parsed.data);
    return NextResponse.json({
      sloganEn: branding.sloganEn,
      sloganHi: branding.sloganHi,
      tagline: branding.tagline,
    });
  } catch (err) {
    console.error("Branding update failed:", err);
    return NextResponse.json(
      { error: "Failed to save branding. Please try again." },
      { status: 500 }
    );
  }
}
