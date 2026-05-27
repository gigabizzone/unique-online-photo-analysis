// POST /api/report/generate
// Body: { entryId: string }
// Behaviour:
//   1. Look up the AnalysisEntry (+ Customer) — must belong to an existing
//      entry; we don't take any payload data, only the id.
//   2. Render the appropriate report (Chakra for now; Phase 11 will add the
//      other five via a switch on entry.analysisType).
//   3. Upload the PDF to Supabase Storage at <publicId>.pdf.
//   4. Stash the public URL onto the AnalysisEntry row.
//   5. Return { publicId, pdfStorageUrl }.
//
// All of this lives behind auth.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { promises as fs } from "node:fs";
import path from "node:path";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/qr";
import { uploadReportPdf } from "@/lib/supabase-storage";
import { ChakraReport, type ChakraDataRow } from "@/components/reports/ChakraReport";
import { PlanetsReport, type PlanetDataRow } from "@/components/reports/PlanetsReport";

export const runtime = "nodejs";

// We load the logo once per process; subsequent requests reuse the buffer.
let logoDataUrlCache: string | null | undefined;

async function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;
  try {
    const filePath = path.join(process.cwd(), "public", "logo.png");
    const buf = await fs.readFile(filePath);
    logoDataUrlCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoDataUrlCache = null;
  }
  return logoDataUrlCache;
}

function formatDateGenerated(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.entryId) {
    return NextResponse.json({ error: "entryId is required" }, { status: 400 });
  }

  const entry = await prisma.analysisEntry.findUnique({
    where: { id: body.entryId },
    include: { customer: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const publicReportUrl = `${appUrl.replace(/\/$/, "")}/report/${entry.publicId}`;

  try {
    // 1. QR + logo are common to every report type
    const [qrDataUrl, logoSrc] = await Promise.all([
      generateQrDataUrl(publicReportUrl),
      loadLogoDataUrl(),
    ]);

    // 2. Render the per-type document
    let doc;
    switch (entry.analysisType) {
      case "CHAKRA": {
        const rows = (entry.data as { chakras?: ChakraDataRow[] }).chakras ?? [];
        doc = (
          <ChakraReport
            customerName={`${entry.customer.firstName} ${entry.customer.lastName}`}
            customerGender={entry.customer.gender}
            publicId={entry.publicId}
            dateGenerated={formatDateGenerated(entry.createdAt)}
            chakras={rows}
            summary={entry.summary}
            qrDataUrl={qrDataUrl}
            publicReportUrl={publicReportUrl}
            logoSrc={logoSrc ?? undefined}
          />
        );
        break;
      }
      case "PLANETS": {
        const rows = (entry.data as { planets?: PlanetDataRow[] }).planets ?? [];
        doc = (
          <PlanetsReport
            customerName={`${entry.customer.firstName} ${entry.customer.lastName}`}
            customerGender={entry.customer.gender}
            publicId={entry.publicId}
            dateGenerated={formatDateGenerated(entry.createdAt)}
            planets={rows}
            summary={entry.summary}
            qrDataUrl={qrDataUrl}
            publicReportUrl={publicReportUrl}
            logoSrc={logoSrc ?? undefined}
          />
        );
        break;
      }
      default:
        return NextResponse.json(
          {
            error: `PDF for analysisType=${entry.analysisType} not implemented yet (Phase 11).`,
          },
          { status: 501 }
        );
    }

    // 3. Buffer the PDF + upload
    const pdfBuffer = await renderToBuffer(doc);
    const publicUrl = await uploadReportPdf(entry.publicId, pdfBuffer);

    // 4. Persist the URL + a qrCodeUrl reference (we don't store the QR PNG
    //    itself — just record that we minted one for this URL)
    await prisma.analysisEntry.update({
      where: { id: entry.id },
      data: {
        pdfStorageUrl: publicUrl,
        qrCodeUrl: publicReportUrl,
      },
    });

    return NextResponse.json({
      publicId: entry.publicId,
      pdfStorageUrl: publicUrl,
    });
  } catch (err) {
    console.error("PDF generate failed for", body.entryId, err);
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
