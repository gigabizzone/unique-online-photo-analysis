// POST /api/analysis/elements — PRD §6.3. Same atomic flow as the
// chakra/planets endpoints: upsert Customer → generate publicId via
// Counter → insert AnalysisEntry, all in one Prisma transaction.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePublicId } from "@/lib/publicId";
import { elementsEntrySchema } from "@/lib/schemas/elements";
import { ELEMENTS } from "@/constants/elements";
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

  const parsed = elementsEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { profile, rows, summary } = parsed.data;

  const META_BY_KEY = Object.fromEntries(
    ELEMENTS.map((e) => [e.key, e])
  ) as Record<string, (typeof ELEMENTS)[number]>;

  const dataPayload = {
    // Presentation rules this entry was created under: a positive reading
    // shows as a percentage, anything at or below zero shows only as
    // "Negative Energy Detected". Entries saved before this have no
    // formatVersion and keep their original bars and numbers, so links
    // already delivered to customers never change retroactively.
    formatVersion: REPORT_FORMAT_VERSION,
    elements: rows.map((row) => {
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

      const publicId = await generatePublicId("ELM", tx);

      const entry = await tx.analysisEntry.create({
        data: {
          publicId,
          customerId: customer.id,
          analysisType: "ELEMENTS",
          data: dataPayload,
          summary,
        },
        select: { id: true, publicId: true },
      });

      return { customerId: customer.id, ...entry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Elements entry save failed:", err);
    return NextResponse.json(
      { error: "Failed to save entry. Please try again." },
      { status: 500 }
    );
  }
}
