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
  gold: "#D4A24C",
  goldLight: "#E8B86A",
  textDark: "#1F1B2E",
  textMuted: "#6B6680",
  border: "#E5E1EC",
  red: "#E74C3C",
  green: "#2ECC71",
  neutralBar: "#E5E7EB",
} as const;

export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  sloganEn: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  sloganHi: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    marginTop: 1,
    // Devanagari script — needs Noto Sans Devanagari (registered in
    // src/lib/pdf-fonts.ts via @fontsource/noto-sans-devanagari).
    fontFamily: "NotoSansDevanagari",
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: PDF_COLORS.gold,
    marginTop: 10,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 9,
    fontStyle: "italic",
    color: PDF_COLORS.gold,
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
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  customerValue: {
    fontSize: 10,
    color: PDF_COLORS.textDark,
    marginTop: 1,
  },
  // ── Section heading ──
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.gold,
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
    fontSize: 10,
    color: PDF_COLORS.textDark,
    lineHeight: 1.5,
  },
  // ── Footer (PRD §7.5 + §7.6) ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 8,
  },
  footerConnectLabel: {
    fontSize: 7,
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
    fontSize: 8,
    color: PDF_COLORS.textDark,
    marginHorizontal: 6,
    textDecoration: "none",
  },
  legalLine: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 36,
    fontSize: 7,
    color: PDF_COLORS.textMuted,
  },
});
