"use client";

// PRD §6.5 — Overall Analysis (3 fixed rows: Positive Energy,
// Negative Energy, Geopathic Stress). Uses ScoreRowsAnalysisFlow.

import {
  ScoreRowsAnalysisFlow,
  type ScoreRowDef,
} from "@/components/forms/ScoreRowsAnalysisFlow";
import { OVERALL_ROWS } from "@/constants/overall";

const ROWS: readonly ScoreRowDef[] = OVERALL_ROWS.map((r) => ({
  key: r.key,
  label: r.label,
  color: r.color,
}));

export default function OverallPage() {
  return (
    <ScoreRowsAnalysisFlow
      config={{
        pageTitle: "Overall Analysis",
        pageSubtitle:
          "Score the customer's positive / negative energy and geopathic stress from −50 to +50.",
        step2Heading: "Step 2 — Overall energies",
        step2Subheading:
          "Range: −50 (deeply afflicted) to +50 (strongly favourable). 0 = neutral.",
        rows: ROWS,
        notesLabel: "Implication",
        notesPlaceholderFor: (row) =>
          `Implication for ${row.label.toLowerCase()}…`,
        summaryPlaceholder:
          "Overall observation across positive, negative, and geopathic dimensions (2–4 paragraphs)…",
        generateButtonLabel: "Generate Overall Report",
        apiPath: "/api/analysis/overall",
        payloadRowsKey: "rows",
        savedHeading: "Overall entry saved",
      }}
    />
  );
}
