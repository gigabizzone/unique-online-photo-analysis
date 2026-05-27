"use client";

// PRD §6.3 — Elements Analysis entry form (7 rows: Fire/Earth/Water/
// Space/Air/Wood/Metal). Reuses ScoreRowsAnalysisFlow.

import {
  ScoreRowsAnalysisFlow,
  type ScoreRowDef,
} from "@/components/forms/ScoreRowsAnalysisFlow";
import { ELEMENTS } from "@/constants/elements";

const ROWS: readonly ScoreRowDef[] = ELEMENTS.map((e) => ({
  key: e.key,
  label: e.label,
  sanskrit: e.sanskrit || undefined,
  color: e.color,
}));

export default function ElementsPage() {
  return (
    <ScoreRowsAnalysisFlow
      config={{
        pageTitle: "Elements Analysis",
        pageSubtitle:
          "Enter elemental energy values from −50 to +50 and their implications.",
        step2Heading: "Step 2 — Elemental energies",
        step2Subheading:
          "Range: −50 (depleted) to +50 (abundantly present). 0 = balanced.",
        rows: ROWS,
        notesLabel: "Implication",
        notesPlaceholderFor: (row) =>
          `Implication for ${row.label.toLowerCase()} element…`,
        summaryPlaceholder:
          "Overall observation across all seven elements (2–4 paragraphs)…",
        generateButtonLabel: "Generate Elements Report",
        apiPath: "/api/analysis/elements",
        payloadRowsKey: "rows",
        savedHeading: "Elements entry saved",
      }}
    />
  );
}
