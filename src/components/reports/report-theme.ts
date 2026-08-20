// Shared theme tokens for all @react-pdf reports.
// PRD §3.4 colour palette + §3.6 typography. Latin body = Helvetica (built-in);
// Devanagari (Hindi slogan) = Noto Sans Devanagari, registered here.

import { StyleSheet } from "@react-pdf/renderer";

import { registerPdfFonts } from "@/lib/pdf-fonts";

// Side-effect: register custom fonts on first import of the theme. Idempotent.
registerPdfFonts();

export const PDF_COLORS = {
  bgDark1: "#0B0420",
  bgDark2: "#1A0B3D",
  card: "#FFFFFF",
  cardAlt: "#F8F7FB",
  gold: "#D4A24C", // retained token; no longer used for report text
  goldLight: "#E8B86A",
  // Headings/titles now use a dark brand purple instead of gold — gold text is
  // hard to read on the white PDF (client feedback, 2026-07).
  heading: "#28194A",
  textDark: "#111111", // darkened body text for stronger contrast
  textMuted: "#4A4658", // darkened secondary text for readability
  border: "#E5E1EC",
  red: "#E74C3C",
  green: "#2ECC71",
  neutralBar: "#E5E7EB",
} as const;

export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: PDF_COLORS.textDark,
    backgroundColor: PDF_COLORS.card,
    padding: 36, // 0.5 inch (PRD §7.7)
    lineHeight: 1.35,
  },
  // ── Universal Header (PRD §7.1) ──
  brandBar: {
    alignItems: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 17,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  sloganEn: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  sloganHi: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
    marginTop: 1,
    // Devanagari script — needs Noto Sans Devanagari (registered in
    // src/lib/pdf-fonts.ts via @fontsource/noto-sans-devanagari).
    fontFamily: "NotoSansDevanagari",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: PDF_COLORS.heading,
    marginTop: 10,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 10,
    fontStyle: "italic",
    color: PDF_COLORS.heading,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  // ── Customer info strip (PRD §7.1) ──
  customerStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: PDF_COLORS.cardAlt,
    borderRadius: 4,
  },
  customerLabel: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  customerValue: {
    fontSize: 11,
    color: PDF_COLORS.textDark,
    marginTop: 1,
  },
  // ── Section heading ──
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.heading,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  // ── Summary card (PRD §7.3) ──
  summaryCard: {
    backgroundColor: PDF_COLORS.cardAlt,
    borderRadius: 6,
    padding: 14,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 11,
    color: PDF_COLORS.textDark,
    lineHeight: 1.5,
  },
  // ── Footer (PRD §7.5 + §7.6) ──
  // Flows at the end of the document rather than being pinned to each page.
  // Absolute positioning here (with `fixed` on the View) repeated the footer
  // on every page and let body text run underneath it on multi-page reports.
  footer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 8,
  },
  footerConnectLabel: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 4,
  },
  footerSocialRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerSocialLink: {
    fontSize: 9,
    color: PDF_COLORS.textDark,
    marginHorizontal: 6,
    textDecoration: "none",
  },
  legalLine: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
});
