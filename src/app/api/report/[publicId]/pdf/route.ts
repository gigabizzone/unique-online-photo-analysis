// GET /api/report/[publicId]/pdf
//
// Streams the previously-uploaded PDF from Supabase Storage. We proxy through
// our own endpoint instead of exposing the raw bucket URL so we can later add
// access controls (rate limiting, signed URLs, revocation by publicId) without
// changing what the QR code on the printed report points to.
//
// Tracks pdfDownloadedAt on the AnalysisEntry the first time a fresh fetch
// hits this route — useful for the History page (Phase 12).
//
// This route is INTENTIONALLY public (no auth). The public-facing report URL
// must be openable by anyone with the QR-code link.

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { downloadReportPdf } from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;

  // Confirm the entry exists before we hit Storage (avoids leaking the
  // bucket's 404 details and lets us mark pdfDownloadedAt).
  const entry = await prisma.analysisEntry.findUnique({
    where: { publicId },
    select: { id: true, customer: { select: { lastName: true } } },
  });
  if (!entry) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const buf = await downloadReportPdf(publicId);
  if (!buf) {
    return NextResponse.json(
      { error: "PDF not yet generated for this report" },
      { status: 404 }
    );
  }

  // Best-effort timestamp — don't block the response if it fails.
  prisma.analysisEntry
    .update({
      where: { id: entry.id },
      data: { pdfDownloadedAt: new Date() },
    })
    .catch((e) => console.error("pdfDownloadedAt update failed", e));

  const lastName = entry.customer.lastName.replace(/[^A-Za-z0-9_-]/g, "");
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `APS_${publicId}_${lastName}_${ymd}.pdf`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
