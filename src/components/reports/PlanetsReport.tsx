// 9 Planets Analysis PDF template — @react-pdf/renderer.
// PRD §7.1-7.7 + §6.2. Structurally identical to ChakraReport.tsx with
// per-form copy swapped (title, IMPLEMENTATION heading).

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

import { ReportHeader } from "./ReportHeader";
import { ReportFooter } from "./ReportFooter";
import { QRBlock } from "./QRBlock";
import { PDF_COLORS, baseStyles } from "./report-theme";
import { scoreToBarPosition } from "@/lib/score-color";

const localStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
  },
  rowLeft: {
    width: 130,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  swatch: { width: 14, height: 14, borderRadius: 7, marginTop: 2 },
  rowName: { fontSize: 10, fontWeight: "bold", color: PDF_COLORS.textDark },
  rowSanskrit: {
    fontSize: 8,
    fontStyle: "italic",
    color: PDF_COLORS.textMuted,
    marginTop: 1,
  },
  rowCenter: { flex: 1, paddingHorizontal: 10 },
  barTrack: {
    height: 8,
    backgroundColor: PDF_COLORS.neutralBar,
    borderRadius: 4,
    position: "relative",
  },
  barCenterLine: {
    position: "absolute",
    left: "50%",
    top: -2,
    bottom: -2,
    width: 1,
    backgroundColor: "#BBB3C7",
  },
  barFill: { position: "absolute", top: 0, bottom: 0, borderRadius: 4 },
  barScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  barScaleLabel: { fontSize: 7, color: PDF_COLORS.textMuted },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 4,
    color: PDF_COLORS.textDark,
  },
  rowRight: { width: 200, flexShrink: 0, paddingLeft: 10 },
  rowImplicationHeading: {
    fontSize: 7,
    fontWeight: "bold",
    color: PDF_COLORS.gold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  rowImplicationBody: {
    fontSize: 9,
    color: PDF_COLORS.textDark,
    lineHeight: 1.4,
  },
});

export interface PlanetDataRow {
  key: string;
  label: string;
  sanskrit: string;
  color: string;
  score: number;
  implication: string;
}

export interface PlanetsReportProps {
  customerName: string;
  customerGender: string;
  publicId: string;
  dateGenerated: string;
  planets: PlanetDataRow[];
  summary: string;
  qrDataUrl: string;
  publicReportUrl: string;
  logoSrc?: string;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pos = scoreToBarPosition(score);
  const isPositive = score >= 0;
  const leftPercent = isPositive ? 50 : pos * 100;
  const widthPercent = Math.abs(pos - 0.5) * 100;
  const fillColor = score === 0 ? PDF_COLORS.neutralBar : color;
  return (
    <View style={localStyles.barTrack}>
      <View style={localStyles.barCenterLine} />
      <View
        style={[
          localStyles.barFill,
          {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: fillColor,
            opacity: score === 0 ? 1 : 0.85,
          },
        ]}
      />
    </View>
  );
}

export function PlanetsReport({
  customerName,
  customerGender,
  publicId,
  dateGenerated,
  planets,
  summary,
  qrDataUrl,
  publicReportUrl,
  logoSrc,
}: PlanetsReportProps) {
  return (
    <Document
      title={`9 Planets Analysis ${publicId}`}
      author="Aura Photo Science"
      subject="9 Planets Analysis Report"
    >
      <Page size="A4" style={baseStyles.page}>
        <ReportHeader
          reportTitle="9 PLANETS ANALYSIS REPORT"
          customerName={customerName}
          customerGender={customerGender}
          dateGenerated={dateGenerated}
          reportId={publicId}
          logoSrc={logoSrc}
        />

        <Text style={baseStyles.sectionHeading}>Planetary Energy Readings</Text>

        {planets.map((p) => (
          <View key={p.key} style={localStyles.row} wrap={false}>
            <View style={localStyles.rowLeft}>
              <View
                style={[localStyles.swatch, { backgroundColor: p.color }]}
              />
              <View>
                <Text style={localStyles.rowName}>{p.label}</Text>
                {p.sanskrit ? (
                  <Text style={localStyles.rowSanskrit}>{p.sanskrit}</Text>
                ) : null}
              </View>
            </View>

            <View style={localStyles.rowCenter}>
              <ScoreBar score={p.score} color={p.color} />
              <View style={localStyles.barScale}>
                <Text style={localStyles.barScaleLabel}>−50</Text>
                <Text style={localStyles.barScaleLabel}>0</Text>
                <Text style={localStyles.barScaleLabel}>+50</Text>
              </View>
              <Text style={localStyles.scoreLabel}>
                {p.score > 0 ? "+" : ""}
                {p.score}
              </Text>
            </View>

            <View style={localStyles.rowRight}>
              <Text style={localStyles.rowImplicationHeading}>
                Recommendation
              </Text>
              <Text style={localStyles.rowImplicationBody}>
                {p.implication || "—"}
              </Text>
            </View>
          </View>
        ))}

        <Text style={baseStyles.sectionHeading}>Summary</Text>
        <View style={baseStyles.summaryCard}>
          <Text style={baseStyles.summaryText}>{summary}</Text>
        </View>

        <QRBlock qrDataUrl={qrDataUrl} publicReportUrl={publicReportUrl} />

        <ReportFooter />
      </Page>
    </Document>
  );
}
