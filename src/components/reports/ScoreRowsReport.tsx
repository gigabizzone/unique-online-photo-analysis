// Generic @react-pdf template for any analysis whose body is a fixed
// list of "score row + notes" (Chakra, Planets, Elements, Overall).
// Variation lives in the props: reportTitle, sectionHeading,
// notesHeading, and the rows array.
//
// Phase 11.4 Life Challenges and Phase 11.6 Wearables don't fit this
// shape and use their own templates.

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

export interface ScoreRowsReportRow {
  key: string;
  label: string;
  sanskrit?: string;
  color: string;
  score: number;
  implication: string;
}

export interface ScoreRowsReportProps {
  /** e.g. "7 CHAKRA ANALYSIS REPORT" */
  reportTitle: string;
  /** e.g. "Chakra Energy Readings" */
  sectionHeading: string;
  /** Heading for the right-hand notes column: "Implication" / "Recommendation" */
  notesHeading: string;
  customerName: string;
  customerGender: string;
  publicId: string;
  dateGenerated: string;
  rows: ScoreRowsReportRow[];
  summary: string;
  qrDataUrl: string;
  publicReportUrl: string;
  logoSrc?: string;
  /** Optional editable branding overrides (Phase 12.3). */
  appName?: string;
  sloganEn?: string;
  sloganHi?: string;
  tagline?: string;
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

export function ScoreRowsReport({
  reportTitle,
  sectionHeading,
  notesHeading,
  customerName,
  customerGender,
  publicId,
  dateGenerated,
  rows,
  summary,
  qrDataUrl,
  publicReportUrl,
  logoSrc,
  appName,
  sloganEn,
  sloganHi,
  tagline,
}: ScoreRowsReportProps) {
  return (
    <Document
      title={`${reportTitle} ${publicId}`}
      author="Aura Photo Science"
      subject={reportTitle}
    >
      <Page size="A4" style={baseStyles.page}>
        <ReportHeader
          reportTitle={reportTitle}
          customerName={customerName}
          customerGender={customerGender}
          dateGenerated={dateGenerated}
          reportId={publicId}
          logoSrc={logoSrc}
          appName={appName}
          sloganEn={sloganEn}
          sloganHi={sloganHi}
          tagline={tagline}
        />

        <Text style={baseStyles.sectionHeading}>{sectionHeading}</Text>

        {rows.map((r) => (
          <View key={r.key} style={localStyles.row} wrap={false}>
            <View style={localStyles.rowLeft}>
              <View
                style={[localStyles.swatch, { backgroundColor: r.color }]}
              />
              <View>
                <Text style={localStyles.rowName}>{r.label}</Text>
                {r.sanskrit ? (
                  <Text style={localStyles.rowSanskrit}>{r.sanskrit}</Text>
                ) : null}
              </View>
            </View>

            <View style={localStyles.rowCenter}>
              <ScoreBar score={r.score} color={r.color} />
              <View style={localStyles.barScale}>
                <Text style={localStyles.barScaleLabel}>−50</Text>
                <Text style={localStyles.barScaleLabel}>0</Text>
                <Text style={localStyles.barScaleLabel}>+50</Text>
              </View>
              <Text style={localStyles.scoreLabel}>
                {r.score > 0 ? "+" : ""}
                {r.score}
              </Text>
            </View>

            <View style={localStyles.rowRight}>
              <Text style={localStyles.rowImplicationHeading}>
                {notesHeading}
              </Text>
              <Text style={localStyles.rowImplicationBody}>
                {r.implication || "—"}
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
