// Public report page. PRD §10.4. No auth — anyone with the publicId
// can view + download. This is the URL the QR code in every PDF
// resolves to.
//
// Middleware excludes /report/* and /api/report/* from auth (set up
// in Phase 3 + Phase 7), so this entire path works for anonymous
// visitors. The Download PDF button hits /api/report/<publicId>/pdf
// which is also public and streams the bytes from Supabase Storage.

import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { BRAND } from "@/constants/branding";
import { AuraLogo } from "@/components/AuraLogo";
import { SocialFooter } from "@/components/SocialFooter";
import { Button } from "@/components/ui/button";
import {
  ChakraPublicView,
  type ChakraPublicRow,
} from "@/components/reports/public/ChakraPublicView";

interface ReportPageProps {
  params: { publicId: string };
}

const ANALYSIS_TYPE_LABEL: Record<string, string> = {
  CHAKRA: "7 Chakra Analysis",
  PLANETS: "9 Planets Analysis",
  ELEMENTS: "Elements Analysis",
  LIFE_CHALLENGES: "Life Challenges Analysis",
  OVERALL: "Overall Analysis",
  WEARABLES: "Wearable Items Analysis",
};

async function loadEntry(publicId: string) {
  return prisma.analysisEntry.findUnique({
    where: { publicId },
    include: { customer: true },
  });
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const entry = await loadEntry(params.publicId);
  if (!entry) {
    return { title: "Report not found — Aura Photo Science" };
  }
  const type = ANALYSIS_TYPE_LABEL[entry.analysisType] ?? entry.analysisType;
  return {
    title: `${type} — ${entry.publicId} — ${BRAND.brand}`,
    description: `${type} report for ${entry.customer.firstName} ${entry.customer.lastName}`,
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PublicReportPage({ params }: ReportPageProps) {
  const entry = await loadEntry(params.publicId);
  if (!entry) notFound();

  const typeLabel =
    ANALYSIS_TYPE_LABEL[entry.analysisType] ?? entry.analysisType;
  const customerFullName = `${entry.customer.firstName} ${entry.customer.lastName}`;
  const pdfHref = `/api/report/${entry.publicId}/pdf`;
  const pdfReady = !!entry.pdfStorageUrl;

  // Per-type body. For now only CHAKRA is implemented (Phase 6+7);
  // the other five forms arrive in Phase 11 with their own *PublicView
  // components. Falls back to a friendly placeholder for those types
  // so the page doesn't crash if a non-Chakra entry is opened early.
  let body: React.ReactNode;
  if (entry.analysisType === "CHAKRA") {
    const data = entry.data as { chakras?: ChakraPublicRow[] };
    body = <ChakraPublicView rows={data.chakras ?? []} summary={entry.summary} />;
  } else {
    body = (
      <section className="rounded-xl bg-white text-aps-text-light-bg p-6 shadow-lg">
        <p className="text-sm text-muted-foreground">
          Public view for{" "}
          <strong className="text-foreground">{typeLabel}</strong> reports
          arrives in Phase 11.
        </p>
        <p className="mt-2 text-sm">
          You can still <a className="text-aps-gold underline" href={pdfHref}>download the PDF</a>.
        </p>
      </section>
    );
  }

  return (
    <div className="aps-gradient-bg min-h-screen flex flex-col text-white">
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        {/* HERO / brand strip */}
        <header className="text-center">
          <div className="flex justify-center">
            <AuraLogo size={120} />
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
            {BRAND.appName}
          </h1>
          <p className="mt-2 text-sm italic text-white/75">{BRAND.sloganEn}</p>
          <p className="mt-0.5 text-sm text-white/55">{BRAND.sloganHi}</p>
          <p className="mt-4 text-sm font-semibold tracking-wide text-aps-gold uppercase">
            {BRAND.tagline}
          </p>
        </header>

        {/* Report title */}
        <h2 className="mt-10 text-center text-xs sm:text-sm font-bold tracking-[0.25em] text-aps-gold uppercase">
          {typeLabel} Report
        </h2>

        {/* Customer info strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center sm:text-left">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              Name
            </div>
            <div className="text-sm font-medium mt-0.5">{customerFullName}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              Gender
            </div>
            <div className="text-sm font-medium mt-0.5">
              {entry.customer.gender}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              Date
            </div>
            <div className="text-sm font-medium mt-0.5">
              {formatDate(entry.createdAt)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              Report ID
            </div>
            <div className="text-sm font-mono mt-0.5">{entry.publicId}</div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-6">{body}</div>

        {/* Download PDF CTA */}
        {pdfReady && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={pdfHref} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </a>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Admin login
              </Button>
            </Link>
          </div>
        )}

        {/* Legal */}
        <p className="mt-10 text-center text-xs italic text-white/45 max-w-2xl mx-auto">
          {BRAND.legalDisclaimer}
        </p>
      </main>

      <SocialFooter />
    </div>
  );
}
