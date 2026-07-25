// PRD §7.4 — QR code block. "Scan to view this report online anytime"
// QR encodes {APP_URL}/report/{publicId}. Sized at ~1.2" (≈ 86 pt).

import { View, Text, Image } from "@react-pdf/renderer";

import { PDF_COLORS } from "./report-theme";

export interface QRBlockProps {
  qrDataUrl: string;
  publicReportUrl: string;
}

export function QRBlock({ qrDataUrl, publicReportUrl }: QRBlockProps) {
  return (
    <View
      style={{
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 10,
      }}
      wrap={false}
    >
      <View style={{ alignItems: "flex-end", maxWidth: 280 }}>
        <Text
          style={{
            fontSize: 9,
            textTransform: "uppercase",
            color: PDF_COLORS.textMuted,
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          Scan to view this report online anytime
        </Text>
        <Text style={{ fontSize: 9, color: PDF_COLORS.textDark }}>
          {publicReportUrl}
        </Text>
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={qrDataUrl} style={{ width: 86, height: 86 }} />
    </View>
  );
}
