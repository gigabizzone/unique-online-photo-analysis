// GET /api/history?type=<TYPE>&from=<ISO>&to=<ISO>&q=<text>&page=<n>&pageSize=<n>
//
// Returns the list of AnalysisEntry rows visible to the admin, with
// optional filters (matches PRD §10.1):
//   - type:       Prisma AnalysisType enum, e.g. CHAKRA
//   - from / to:  ISO-date range over createdAt (inclusive)
//   - q:          free-text matched against publicId + customer
//                 name / email / whatsapp (case-insensitive contains)
//   - page:       1-based (default 1)
//   - pageSize:   default 50, max 200

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"));
  const q = (url.searchParams.get("q") ?? "").trim();
  const customerId = url.searchParams.get("customer");

  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");
  const pageRaw = pageParam ? Number(pageParam) : NaN;
  const pageSizeRaw = pageSizeParam ? Number(pageSizeParam) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.max(Math.floor(pageSizeRaw), 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

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

  const [total, entries] = await Promise.all([
    prisma.analysisEntry.count({ where }),
    prisma.analysisEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        publicId: true,
        analysisType: true,
        pdfStorageUrl: true,
        emailSentAt: true,
        whatsappOpenedAt: true,
        pdfDownloadedAt: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            whatsapp: true,
            gender: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    entries,
  });
}
