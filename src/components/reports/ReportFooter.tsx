// Universal report footer (PRD §7.5 social + §7.6 legal).
//
// Flows as ordinary content at the very end of the document, so it appears
// exactly once, directly beneath the last block of the report.
//
// It used to be `fixed` + absolutely positioned, which made @react-pdf repeat
// it on every page. Because the page reserves only its normal 36pt bottom
// padding, flowing content ran underneath the repeated footer and collided
// with it on any report longer than one page. Keeping the footer in the normal
// flow removes that overlap entirely — there is nothing left to overlap with.
//
// `wrap={false}` keeps the block from being split across a page boundary.

import { View, Text, Link } from "@react-pdf/renderer";

import { BRAND, SOCIAL_LINKS } from "@/constants/branding";
import { baseStyles } from "./report-theme";

export function ReportFooter() {
  return (
    <View style={baseStyles.footer} wrap={false}>
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
    </View>
  );
}
