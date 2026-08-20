// Wearable Items / Money Energy PDF template — PRD §6.6 + §7.
// Each row has TWO bars (green positive 0→+50, red negative 0→-50)
// plus a Money Energy Impact paragraph. Below the table, a numbered
// Remarks list of up to 5 entries (blanks skipped).

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
import type { RowDisplay } from "@/lib/report-display";

const POSITIVE_COLOR = "#2ECC71";
const NEGATIVE_COLOR = "#E74C3C";

const styles = StyleSheet.create({
  // Same three-column shape as ScoreRowsReport (Chakra / Planets / Elements):
  // name on the left, reading in the middle, notes on the right.
  item: {
    flexDirection: "row",
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
  },
  itemLeft: {
    width: 130,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  itemCenter: { flex: 1, paddingHorizontal: 10 },
  itemRight: { width: 200, flexShrink: 0, paddingLeft: 10 },
  numBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3,
  },
  itemName: { fontSize: 12, fontWeight: "bold", color: PDF_COLORS.textDark },
  barsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  barCol: { flex: 1 },
  barLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  barTrack: {
    height: 7,
    backgroundColor: PDF_COLORS.neutralBar,
    borderRadius: 4,
    position: "relative",
  },
  barFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 4,
  },
  barScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  barScaleLabel: { fontSize: 8, color: PDF_COLORS.textMuted },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
    marginTop: 2,
  },
  // "Negative Energy Detected" — replaces the bar and number entirely.
  detectLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  moneyHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: PDF_COLORS.heading,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  moneyBody: {
    fontSize: 10,
    color: PDF_COLORS.textDark,
    lineHeight: 1.4,
  },
  remarksList: {
    paddingLeft: 4,
  },
  remarkRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  remarkNum: {
    width: 16,
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.heading,
  },
  remarkText: {
    flex: 1,
    fontSize: 10,
    color: PDF_COLORS.textDark,
    lineHeight: 1.4,
  },
});

export interface WearableItem {
  key: string;
  name: string;
  color: string;
  moneyEnergy: string;
  /** Single -50..+50 reading. Present on entries saved after the twin-slider
   *  form was replaced; absent on legacy entries. */
  score?: number;
  /** Legacy twin scores, kept so already-delivered reports still render. */
  positiveScore?: number;
  negativeScore?: number;
  /** v2 entries only: percentage (with bar) or "Negative Energy Detected". */
  display?: RowDisplay;
}

export interface WearablesReportProps {
  customerName: string;
  customerGender: string;
  publicId: string;
  dateGenerated: string;
  items: WearableItem[];
  remarks: string[];
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

function PositiveBar({ value }: { value: number }) {
  const widthPct = Math.max(0, Math.min(50, value)) * 2; // 0..100
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${widthPct}%`, backgroundColor: POSITIVE_COLOR, opacity: 0.85 },
        ]}
      />
    </View>
  );
}

function NegativeBar({ value }: { value: number }) {
  // value is in -50..0 so map magnitude to width
  const widthPct = Math.max(0, Math.min(50, Math.abs(value))) * 2; // 0..100
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${widthPct}%`, backgroundColor: NEGATIVE_COLOR, opacity: 0.85 },
        ]}
      />
    </View>
  );
}

export function WearablesReport({
  customerName,
  customerGender,
  publicId,
  dateGenerated,
  items,
  remarks,
  summary,
  qrDataUrl,
  publicReportUrl,
  logoSrc,
  appName,
  sloganEn,
  sloganHi,
  tagline,
}: WearablesReportProps) {
  const nonEmptyRemarks = remarks
    .map((r, i) => ({ text: r.trim(), idx: i }))
    .filter((r) => r.text.length > 0);

  return (
    <Document
      title={`Money Energy Report ${publicId}`}
      author="Aura Photo Science"
      subject="Wearable Items Money Energy Analysis"
    >
      <Page size="A4" style={baseStyles.page}>
        <ReportHeader
          reportTitle="WEARABLE ITEMS / MONEY ENERGY REPORT"
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

        <Text style={baseStyles.sectionHeading}>Wearable Items</Text>

        {items.map((it, i) => (
          <View key={it.key} style={styles.item} wrap={false}>
            <View style={styles.itemLeft}>
              <Text style={[styles.numBadge, { backgroundColor: it.color }]}>
                {i + 1}
              </Text>
              <View>
                <Text style={styles.itemName}>{it.name}</Text>
              </View>
            </View>

            <View style={styles.itemCenter}>
              {it.display?.mode === "percent" ? (
                // One reading per object: a share of the positive half-axis,
                // with a bar, exactly as a chakra reads.
                <>
                  <PositiveBar value={(it.display.percent / 100) * 50} />
                  <View style={styles.barScale}>
                    <Text style={styles.barScaleLabel}>0%</Text>
                    <Text style={styles.barScaleLabel}>100%</Text>
                  </View>
                  <Text style={[styles.scoreLabel, { color: POSITIVE_COLOR }]}>
                    {it.display.percent}%
                    {it.display.suffix ? ` ${it.display.suffix}` : ""}
                  </Text>
                </>
              ) : it.display?.mode === "detect" ? (
                // No bar and no number — the score stays an admin-side record.
                <Text style={[styles.detectLabel, { color: NEGATIVE_COLOR }]}>
                  {it.display.text}
                </Text>
              ) : (
                // Legacy entry: twin positive/negative bars, as delivered.
                <View style={styles.barsRow}>
                  <View style={styles.barCol}>
                    <Text style={[styles.barLabel, { color: POSITIVE_COLOR }]}>
                      Positive Energy
                    </Text>
                    <PositiveBar value={it.positiveScore ?? 0} />
                    <View style={styles.barScale}>
                      <Text style={styles.barScaleLabel}>0</Text>
                      <Text style={styles.barScaleLabel}>+50</Text>
                    </View>
                    <Text style={styles.scoreLabel}>
                      +{it.positiveScore ?? 0}
                    </Text>
                  </View>
                  <View style={styles.barCol}>
                    <Text style={[styles.barLabel, { color: NEGATIVE_COLOR }]}>
                      Negative Energy
                    </Text>
                    <NegativeBar value={it.negativeScore ?? 0} />
                    <View style={styles.barScale}>
                      <Text style={styles.barScaleLabel}>0</Text>
                      <Text style={styles.barScaleLabel}>−50</Text>
                    </View>
                    <Text style={styles.scoreLabel}>
                      {it.negativeScore ?? 0}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.itemRight}>
              <Text style={styles.moneyHeading}>Money Energy Impact</Text>
              <Text style={styles.moneyBody}>{it.moneyEnergy || "—"}</Text>
            </View>
          </View>
        ))}

        {nonEmptyRemarks.length > 0 ? (
          <>
            <Text style={baseStyles.sectionHeading}>
              Remarks / Recommendations
            </Text>
            <View style={styles.remarksList}>
              {nonEmptyRemarks.map(({ text, idx }) => (
                <View key={idx} style={styles.remarkRow} wrap={false}>
                  <Text style={styles.remarkNum}>{idx + 1}.</Text>
                  <Text style={styles.remarkText}>{text}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

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
