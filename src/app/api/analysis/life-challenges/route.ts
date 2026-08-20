// POST /api/analysis/life-challenges — PRD §6.4. Mostly the same
// transactional flow as the score-rows forms, but the row labels come
// from the admin (not a preset list), and each row gets a rotated
// colour assigned server-side so the saved data has everything the PDF
// + public view need.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePublicId } from "@/lib/publicId";
import { lifeChallengesEntrySchema } from "@/lib/schemas/life-challenges";
import { colorForLifeChallengeRow } from "@/constants/life-challenges";
import { REPORT_FORMAT_VERSION } from "@/lib/report-display";

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

  const parsed = lifeChallengesEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { profile, rows, summary } = parsed.data;

  const dataPayload = {
    // Presentation rules this entry was created under: a positive reading
    // shows as a percentage, anything at or below zero shows only as
    // "Negative Energy Detected". Entries saved before this have no
    // formatVersion and keep their original bars and numbers, so links
    // already delivered to customers never change retroactively.
    formatVersion: REPORT_FORMAT_VERSION,
    challenges: rows.map((row, idx) => ({
      key: `c${idx + 1}`,
      label: row.label,
      sanskrit: "",
      color: colorForLifeChallengeRow(idx),
      score: row.score,
      implication: row.implication,
    })),
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

      const publicId = await generatePublicId("LCH", tx);

      const entry = await tx.analysisEntry.create({
        data: {
          publicId,
          customerId: customer.id,
          analysisType: "LIFE_CHALLENGES",
          data: dataPayload,
          summary,
        },
        select: { id: true, publicId: true },
      });

      return { customerId: customer.id, ...entry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Life Challenges entry save failed:", err);
    return NextResponse.json(
      { error: "Failed to save entry. Please try again." },
      { status: 500 }
    );
  }
}
