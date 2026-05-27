// POST /api/analysis/overall — PRD §6.5. Fixed-3-rows form.
// Same atomic flow as the other score-rows endpoints.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePublicId } from "@/lib/publicId";
import { overallEntrySchema } from "@/lib/schemas/overall";
import { OVERALL_ROWS } from "@/constants/overall";

export async function POST(req: Request) {
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

  const parsed = overallEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { profile, rows, summary } = parsed.data;

  const META_BY_KEY = Object.fromEntries(
    OVERALL_ROWS.map((r) => [r.key, r])
  ) as Record<string, (typeof OVERALL_ROWS)[number]>;

  const dataPayload = {
    overall: rows.map((row) => {
      const meta = META_BY_KEY[row.key];
      return {
        key: row.key,
        label: meta?.label ?? row.key,
        sanskrit: meta?.sanskrit ?? "",
        color: meta?.color ?? "#999999",
        score: row.score,
        implication: row.implication,
      };
    }),
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: profile.email.toLowerCase() },
        create: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: profile.gender,
          email: profile.email.toLowerCase(),
          whatsapp: profile.whatsapp,
        },
        update: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: profile.gender,
          whatsapp: profile.whatsapp,
        },
      });

      const publicId = await generatePublicId("OVR", tx);

      const entry = await tx.analysisEntry.create({
        data: {
          publicId,
          customerId: customer.id,
          analysisType: "OVERALL",
          data: dataPayload,
          summary,
        },
        select: { id: true, publicId: true },
      });

      return { customerId: customer.id, ...entry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Overall entry save failed:", err);
    return NextResponse.json(
      { error: "Failed to save entry. Please try again." },
      { status: 500 }
    );
  }
}
