// GET /api/customers?q=<text>&page=&pageSize=
//
// Returns the customer master list (PRD §10.2) — one row per Customer
// with a count of their AnalysisEntry rows. Same free-text q semantics
// as /api/customer/search (name / email / whatsapp, ≥2 chars).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");
  const pageRaw = pageParam ? Number(pageParam) : NaN;
  const pageSizeRaw = pageSizeParam ? Number(pageSizeParam) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.max(Math.floor(pageSizeRaw), 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const where: Prisma.CustomerWhereInput = {};
  if (q.length >= 2) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { entries: true } },
        entries: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    customers: customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      gender: c.gender,
      email: c.email,
      whatsapp: c.whatsapp,
      entryCount: c._count.entries,
      lastEntryAt: c.entries[0]?.createdAt ?? null,
      createdAt: c.createdAt,
    })),
  });
}
