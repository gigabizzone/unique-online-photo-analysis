// PRD §9.2-9.5 — manual WhatsApp send via a wa.me deep link.
//
// We don't use WhatsApp Business API (deferred per PRD §1.3). Instead we
// build a wa.me URL that opens WhatsApp Web (desktop) or the WhatsApp app
// (mobile) with the chat to the customer pre-filled. The admin clicks
// "Send" inside WhatsApp itself — zero API cost.
//
// The customer's whatsapp number is stored E.164 (e.g. "+919812345678"),
// but wa.me wants digits only.

import { SOCIAL_LINKS } from "@/constants/branding";
import { getBranding } from "@/lib/branding";

const ANALYSIS_TYPE_LABEL: Record<string, string> = {
  CHAKRA: "7 Chakra Analysis",
  PLANETS: "9 Planets Analysis",
  ELEMENTS: "Elements Analysis",
  LIFE_CHALLENGES: "Life Challenges Analysis",
  OVERALL: "Overall Analysis",
  WEARABLES: "Wearable Items Analysis",
};

function socialHandle(name: string): string {
  return SOCIAL_LINKS.find((s) => s.name === name)?.handle ?? "";
}

export interface WhatsAppLinkInput {
  firstName: string;
  /** E.164 phone, e.g. "+919812345678". Anything non-digit gets stripped. */
  whatsapp: string;
  /** Prisma AnalysisType enum value, e.g. "CHAKRA". */
  analysisType: string;
  publicReportUrl: string;
}

/**
 * Build the wa.me URL with the pre-filled message from PRD §9.3.
 * Async because it reads admin-editable slogans+tagline from the
 * Settings table (Phase 12.3) — server-only callers must await it.
 */
export async function buildWhatsAppLink(
  input: WhatsAppLinkInput
): Promise<string> {
  // wa.me only accepts digits. Strip "+", spaces, dashes, parentheses.
  const phone = input.whatsapp.replace(/[^0-9]/g, "");

  const typeLabel =
    ANALYSIS_TYPE_LABEL[input.analysisType] ?? input.analysisType;

  const branding = await getBranding();

  // Note: this is plain text — WhatsApp doesn't render markdown. Emoji
  // are fine. URL gets percent-encoded by encodeURIComponent.
  const message = [
    `Namaste ${input.firstName} 🙏`,
    ``,
    `Your ${typeLabel} Report from ${branding.brand} is ready.`,
    ``,
    `📥 View / Download your report here:`,
    input.publicReportUrl,
    ``,
    `🌐 Website: ${socialHandle("Website")}`,
    `📘 Facebook: ${socialHandle("Facebook")}`,
    `📸 Instagram: ${socialHandle("Instagram")}`,
    ``,
    `"${branding.sloganEn}"`,
    branding.sloganHi,
    ``,
    branding.tagline,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
