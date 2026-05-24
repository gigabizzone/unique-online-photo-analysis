// Universal report footer (PRD §7.5 social + §7.6 legal).
// Rendered as a fixed absolute position so it appears on every PDF page.

import { View, Text, Link } from "@react-pdf/renderer";

import { BRAND, SOCIAL_LINKS } from "@/constants/branding";
import { baseStyles } from "./report-theme";

export function ReportFooter() {
  return (
    <View style={baseStyles.footer} fixed>
      <Text style={baseStyles.footerConnectLabel}>Connect with us</Text>
      <View style={baseStyles.footerSocialRow}>
        {SOCIAL_LINKS.map((s, i) => (
          <Text key={s.name} style={baseStyles.footerSocialLink}>
            {/* lucide-style brand glyphs aren't worth registering an icon font
                for in PDF — text handles communicate the same info and
                stay accessible for screen readers + copy-paste */}
            <Link src={s.url} style={baseStyles.footerSocialLink}>
              {s.handle}
            </Link>
            {i < SOCIAL_LINKS.length - 1 && (
              <Text style={{ color: "#9c98ab" }}> · </Text>
            )}
          </Text>
        ))}
      </View>
      <Text style={baseStyles.legalLine}>{BRAND.legalDisclaimer}</Text>
      <Text
        style={baseStyles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}
