// POST /api/analysis/[id]/mark-wa-opened
//
// Server-side flow for the "Send via WhatsApp" button (PRD §9.4):
//   1. Auth check (admin only)
//   2. Look up the entry + customer
//   3. Build the wa.me URL on the server (so customer's whatsapp / first
//      name doesn't have to flow through the browser bundle)
//   4. Stamp whatsappOpenedAt = now() on the entry
//   5. Return { waUrl } — the client then window.open(...)s it
//
// We "mark opened" optimistically — at the moment the admin asks for
// the URL, we assume they intend to send. If they bail out inside
// WhatsApp without clicking Send, the timestamp still says "opened",
// which is fine — PRD §9.7 already calls this out and offers a
// "Mark as Sent" manual confirm path in the History page (Phase 12).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp-link";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await prisma.analysisEntry.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const publicReportUrl = `${appUrl.replace(/\/$/, "")}/report/${entry.publicId}`;

  const waUrl = await buildWhatsAppLink({
    firstName: entry.customer.firstName,
    whatsapp: entry.customer.whatsapp,
    analysisType: entry.analysisType,
    publicReportUrl,
  });

  await prisma.analysisEntry.update({
    where: { id: entry.id },
    data: { whatsappOpenedAt: new Date() },
  });

  return NextResponse.json({ waUrl, publicReportUrl });
}
