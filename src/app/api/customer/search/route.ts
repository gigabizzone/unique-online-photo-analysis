// GET /api/customer/search?q=<query>
// Returns up to 8 matching customers — used by CustomerSearch autocomplete.
// Auth-gated: only authenticated admins can search the customer table.
// (RLS would also block this if our app role didn't bypass it, but the
// session check gives us a clean 401 instead of an opaque DB error.)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_RESULTS = 8;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  // Don't query the DB for very short fragments — the UI debounces too,
  // but this is a backstop.
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.customer.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { whatsapp: { contains: q } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      email: true,
      whatsapp: true,
    },
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
  });

  return NextResponse.json({ results });
}
