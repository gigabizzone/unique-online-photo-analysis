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
  min: r.min,
  max: r.max,
}));

export default function OverallPage() {
  return (
    <ScoreRowsAnalysisFlow
      config={{
        pageTitle: "Free Basic Aura Check",
        pageSubtitle:
          "Score the customer's positive energy, negative energy and geopathic stress.",
        step2Heading: "Step 2 — Energy readings",
        step2Subheading:
          "Positive Energy: 0 to +50. Negative Energy: 0 to +50. Geopathic Stress: 0 to −50.",
        rows: ROWS,
        notesLabel: "Implication",
        notesPlaceholderFor: (row) =>
          `Implication for ${row.label.toLowerCase()}…`,
        summaryPlaceholder:
          "Overall observation across positive, negative, and geopathic dimensions (2–4 paragraphs)…",
        generateButtonLabel: "Generate Free Basic Aura Check Report",
        apiPath: "/api/analysis/overall",
        payloadRowsKey: "rows",
        savedHeading: "Free Basic Aura Check entry saved",
      }}
    />
  );
}
