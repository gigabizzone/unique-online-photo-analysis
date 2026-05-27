// Universal report header per PRD §7.1.
// Re-used by all six form report templates (Chakra now, others in Phase 11).

import { View, Text, Image } from "@react-pdf/renderer";

import { BRAND } from "@/constants/branding";
import { baseStyles } from "./report-theme";

export interface ReportHeaderProps {
  reportTitle: string;             // e.g. "7 CHAKRA ANALYSIS REPORT"
  customerName: string;            // "Mukesh Shah"
  customerGender: string;          // "Male"
  dateGenerated: string;           // "24 May 2026" or "Sun, 24 May 2026"
  reportId: string;                // publicId e.g. "APS-2026-CHK-00042"
  logoSrc?: string;                // data URL or file path; gracefully omitted if absent
  // Editable branding overrides — fall back to the static defaults if omitted
  // so this stays a pure sync render-time component for @react-pdf.
  appName?: string;
  sloganEn?: string;
  sloganHi?: string;
  tagline?: string;
}

export function ReportHeader({
  reportTitle,
  customerName,
  customerGender,
  dateGenerated,
  reportId,
  logoSrc,
  appName = BRAND.appName,
  sloganEn = BRAND.sloganEn,
  sloganHi = BRAND.sloganHi,
  tagline = BRAND.tagline,
}: ReportHeaderProps) {
  return (
    <View>
      <View style={baseStyles.brandBar}>
        {logoSrc ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logoSrc} style={{ height: 56, objectFit: "contain" }} />
        ) : (
          <Text style={{ fontSize: 22, color: "#D4A24C", fontWeight: "bold" }}>
            ॐ
          </Text>
        )}
        <Text style={baseStyles.appName}>{appName}</Text>
        <Text style={baseStyles.sloganEn}>{sloganEn}</Text>
        <Text style={baseStyles.sloganHi}>{sloganHi}</Text>
        <Text style={baseStyles.reportTitle}>{reportTitle}</Text>
        <Text style={baseStyles.tagline}>{tagline}</Text>
      </View>

      {/* Customer info strip */}
      <View style={baseStyles.customerStrip}>
        <View>
          <Text style={baseStyles.customerLabel}>Name</Text>
          <Text style={baseStyles.customerValue}>{customerName}</Text>
        </View>
        <View>
          <Text style={baseStyles.customerLabel}>Gender</Text>
          <Text style={baseStyles.customerValue}>{customerGender}</Text>
        </View>
        <View>
          <Text style={baseStyles.customerLabel}>Date</Text>
          <Text style={baseStyles.customerValue}>{dateGenerated}</Text>
        </View>
        <View>
          <Text style={baseStyles.customerLabel}>Report ID</Text>
          <Text style={baseStyles.customerValue}>{reportId}</Text>
        </View>
      </View>
    </View>
  );
}
