// POST /api/analysis/chakra
//
// Atomic flow:
//   1. Upsert the Customer (match by email — emails are practically unique
//      per customer, whereas WhatsApp can be reused across accounts).
//   2. Generate the next publicId from the Counter table (APS-YYYY-CHK-00000).
//   3. Insert the AnalysisEntry with analysisType=CHAKRA, data=JSON snapshot.
//   4. Return { publicId, entryId }.
//
// Wrapped in a single Prisma transaction so a partial failure (e.g. publicId
// bump succeeds but entry insert fails) cannot leave orphan state.
//
// PRD §6.1, §8.1, §8.2.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePublicId } from "@/lib/publicId";
import { chakraEntrySchema } from "@/lib/schemas/chakra";
import { CHAKRAS } from "@/constants/chakras";

export async function POST(req: Request) {
  // 0. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Parse + validate
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chakraEntrySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { profile, chakras, summary } = parsed.data;

  // 2. Enrich the chakra data with the static metadata (label, sanskrit,
  //    color) so the PDF in Phase 7 can render it without re-resolving.
  const META_BY_KEY = Object.fromEntries(
    CHAKRAS.map((c) => [c.key, c])
  ) as Record<string, (typeof CHAKRAS)[number]>;

  const dataPayload = {
    chakras: chakras.map((row) => {
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

  // 3. Transaction: upsert Customer → generate publicId → insert AnalysisEntry
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

      const publicId = await generatePublicId("CHK", tx);

      const entry = await tx.analysisEntry.create({
        data: {
          publicId,
          customerId: customer.id,
          analysisType: "CHAKRA",
          data: dataPayload,
          summary,
        },
        select: { id: true, publicId: true },
      });

      return { customerId: customer.id, ...entry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Chakra entry save failed:", err);
    return NextResponse.json(
      { error: "Failed to save entry. Please try again." },
      { status: 500 }
    );
  }
}
