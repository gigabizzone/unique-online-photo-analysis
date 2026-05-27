// GET /api/history/export?type=&from=&to=&q=
//
// Same filters as /api/history but streams a CSV instead of paginated
// JSON. Used by the "Export CSV" button on /history.

import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_TYPES = new Set([
  "CHAKRA",
  "PLANETS",
  "ELEMENTS",
  "LIFE_CHALLENGES",
  "OVERALL",
  "WEARABLES",
]);

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"));
  const q = (url.searchParams.get("q") ?? "").trim();
  const customerId = url.searchParams.get("customer");

  const where: Prisma.AnalysisEntryWhereInput = {};
  if (type && VALID_TYPES.has(type)) {
    where.analysisType = type as Prisma.EnumAnalysisTypeFilter["equals"];
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (q.length >= 2) {
    where.OR = [
      { publicId: { contains: q, mode: "insensitive" } },
      {
        customer: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { whatsapp: { contains: q } },
          ],
        },
      },
    ];
  }

  const entries = await prisma.analysisEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000, // hard cap to avoid runaway exports
    select: {
      publicId: true,
      analysisType: true,
      pdfStorageUrl: true,
      emailSentAt: true,
      whatsappOpenedAt: true,
      pdfDownloadedAt: true,
      createdAt: true,
      summary: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
          gender: true,
          email: true,
          whatsapp: true,
        },
      },
    },
  });

  const header = [
    "publicId",
    "createdAt",
    "analysisType",
    "firstName",
    "lastName",
    "gender",
    "email",
    "whatsapp",
    "pdfGenerated",
    "emailSentAt",
    "whatsappOpenedAt",
    "pdfDownloadedAt",
    "summary",
  ];

  const lines: string[] = [];
  lines.push(header.map(csvEscape).join(","));
  for (const e of entries) {
    lines.push(
      [
        e.publicId,
        e.createdAt.toISOString(),
        e.analysisType,
        e.customer.firstName,
        e.customer.lastName,
        e.customer.gender,
        e.customer.email,
        e.customer.whatsapp,
        e.pdfStorageUrl ? "yes" : "no",
        e.emailSentAt?.toISOString() ?? "",
        e.whatsappOpenedAt?.toISOString() ?? "",
        e.pdfDownloadedAt?.toISOString() ?? "",
        e.summary,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  // BOM keeps Excel happy with UTF-8 (Hindi etc.)
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const filename = `aps_history_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
