// PRD §8.2 publicId generator: APS-{YYYY}-{TYPE3}-{SEQUENCE5}
//
// Examples:
//   APS-2026-CHK-00001
//   APS-2026-PLN-00042
//
// The sequence is per (year, type). Concurrency-safe because Prisma's upsert
// + { increment: 1 } is one atomic SQL statement, and the Counter row is
// uniquely keyed by `${TYPE3}-${YYYY}` so two requests can't increment the
// same row in conflicting ways — Postgres serializes them.

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type AnalysisTypePrefix = "CHK" | "PLN" | "ELM" | "LCH" | "OVR" | "WRB";

export async function generatePublicId(
  prefix: AnalysisTypePrefix,
  tx?: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const client = tx ?? prisma;

  const counter = await client.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  const sequence = String(counter.value).padStart(5, "0");
  return `APS-${year}-${prefix}-${sequence}`;
}
