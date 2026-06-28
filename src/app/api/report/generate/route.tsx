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
import { getBranding } from "@/lib/branding";
import {
  ScoreRowsReport,
  type ScoreRowsReportRow,
} from "@/components/reports/ScoreRowsReport";
import {
  WearablesReport,
  type WearableItem,
} from "@/components/reports/WearablesReport";
import { OVERALL_RANGE_BY_KEY } from "@/constants/overall";

// Per-analysis-type configuration for the generic ScoreRowsReport.
// Phase 11.4 (Life Challenges) + Phase 11.6 (Wearables) have their own
// templates because their row shape differs.
const SCORE_ROWS_CONFIG: Record<
  string,
  {
    reportTitle: string;
    sectionHeading: string;
    notesHeading: string;
    /** key inside AnalysisEntry.data where the rows array lives */
    dataKey: string;
  }
> = {
  CHAKRA: {
    reportTitle: "7 CHAKRA ANALYSIS REPORT",
    sectionHeading: "Chakra Energy Readings",
    notesHeading: "Implication",
    dataKey: "chakras",
  },
  PLANETS: {
    reportTitle: "9 PLANETS ANALYSIS REPORT",
    sectionHeading: "Planetary Energy Readings",
    notesHeading: "Recommendation",
    dataKey: "planets",
  },
  ELEMENTS: {
    reportTitle: "ELEMENTS ANALYSIS REPORT",
    sectionHeading: "Elemental Energy Readings",
    notesHeading: "Implication",
    dataKey: "elements",
  },
  OVERALL: {
    reportTitle: "FREE BASIC AURA CHECK REPORT",
    sectionHeading: "Basic Aura Energy Readings",
    notesHeading: "Implication",
    dataKey: "overall",
  },
  LIFE_CHALLENGES: {
    reportTitle: "LIFE CHALLENGES ANALYSIS REPORT",
    sectionHeading: "Life Challenges",
    notesHeading: "Implication / Recommendation",
    dataKey: "challenges",
  },
};

export const runtime = "nodejs";

// We load the logo once per process; subsequent requests reuse the buffer.
let logoDataUrlCache: string | null | undefined;

async function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;
  // The PDF has a WHITE background, so it needs the dark print logo
  // (public/logo-report.png). The yellow website logo (public/logo.png) is
  // built for the dark website background and is unreadable on white. Prefer
  // the print logo; fall back to the website logo if it isn't present yet.
  const candidates = ["logo-report.png", "logo.png"];
  for (const name of candidates) {
    try {
      const buf = await fs.readFile(path.join(process.cwd(), "public", name));
      logoDataUrlCache = `data:image/png;base64,${buf.toString("base64")}`;
      return logoDataUrlCache;
    } catch {
      // file not present — try the next candidate
    }
  }
  logoDataUrlCache = null;
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
    // 1. QR + logo + branding are common to every report type
    const [qrDataUrl, logoSrc, branding] = await Promise.all([
      generateQrDataUrl(publicReportUrl),
      loadLogoDataUrl(),
      getBranding(),
    ]);

    // 2. Render the per-type document
    let doc;
    const config = SCORE_ROWS_CONFIG[entry.analysisType];
    if (config) {
      const data = entry.data as Record<string, ScoreRowsReportRow[] | undefined>;
      let rows = data[config.dataKey] ?? [];
      // Free Basic Aura Check rows carry per-row score axes so the bars match
      // the app sliders. Stored rows may predate this, so look the range up by
      // key rather than relying on the persisted payload.
      if (entry.analysisType === "OVERALL") {
        rows = rows.map((r) => ({
          ...r,
          ...(OVERALL_RANGE_BY_KEY[r.key] ?? {}),
        }));
      }
      doc = (
        <ScoreRowsReport
          reportTitle={config.reportTitle}
          sectionHeading={config.sectionHeading}
          notesHeading={config.notesHeading}
          customerName={`${entry.customer.firstName} ${entry.customer.lastName}`}
          customerGender={entry.customer.gender}
          publicId={entry.publicId}
          dateGenerated={formatDateGenerated(entry.createdAt)}
          rows={rows}
          summary={entry.summary}
          qrDataUrl={qrDataUrl}
          publicReportUrl={publicReportUrl}
          logoSrc={logoSrc ?? undefined}
          appName={branding.appName}
          sloganEn={branding.sloganEn}
          sloganHi={branding.sloganHi}
          tagline={branding.tagline}
        />
      );
    } else if (entry.analysisType === "WEARABLES") {
      const data = entry.data as {
        items?: WearableItem[];
        remarks?: string[];
      };
      doc = (
        <WearablesReport
          customerName={`${entry.customer.firstName} ${entry.customer.lastName}`}
          customerGender={entry.customer.gender}
          publicId={entry.publicId}
          dateGenerated={formatDateGenerated(entry.createdAt)}
          items={data.items ?? []}
          remarks={data.remarks ?? []}
          summary={entry.summary}
          qrDataUrl={qrDataUrl}
          publicReportUrl={publicReportUrl}
          logoSrc={logoSrc ?? undefined}
          appName={branding.appName}
          sloganEn={branding.sloganEn}
          sloganHi={branding.sloganHi}
          tagline={branding.tagline}
        />
      );
    } else {
      return NextResponse.json(
        {
          error: `PDF for analysisType=${entry.analysisType} not implemented yet.`,
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
