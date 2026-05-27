"use client";

// PRD §6.1 — 7 Chakra Analysis entry form. All flow logic lives in
// ScoreRowsAnalysisFlow; this page just supplies the configuration.
// Marked "use client" because the config includes a function prop
// (notesPlaceholderFor) — Next.js doesn't allow functions to cross
// the server-to-client component boundary.

import {
  ScoreRowsAnalysisFlow,
  type ScoreRowDef,
} from "@/components/forms/ScoreRowsAnalysisFlow";
import { CHAKRAS } from "@/constants/chakras";

const ROWS: readonly ScoreRowDef[] = CHAKRAS.map((c) => ({
  key: c.key,
  label: c.label,
  sanskrit: c.sanskrit,
  color: c.color,
}));

export default function ChakraPage() {
  return (
    <ScoreRowsAnalysisFlow
      config={{
        pageTitle: "7 Chakra Analysis",
        pageSubtitle:
          "Enter chakra energy values from −50 to +50 and their implications.",
        step2Heading: "Step 2 — Chakra energies",
        step2Subheading:
          "Range: −50 (deeply blocked) to +50 (radiantly open). 0 = neutral.",
        rows: ROWS,
        notesLabel: "Implication",
        notesPlaceholderFor: (row) =>
          `Implication for ${row.label.toLowerCase()} (2–4 lines)`,
        summaryPlaceholder:
          "Overall observation across all seven chakras (2–4 paragraphs)…",
        generateButtonLabel: "Generate Report",
        apiPath: "/api/analysis/chakra",
        // The chakra API endpoint historically expects `chakras: [...]` —
        // keeping the JSON shape rather than risking a migration of
        // existing AnalysisEntry.data rows.
        payloadRowsKey: "chakras",
        savedHeading: "Chakra entry saved",
      }}
    />
  );
}
