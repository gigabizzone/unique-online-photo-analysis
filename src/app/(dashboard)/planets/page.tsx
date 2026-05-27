"use client";

// PRD §6.2 — 9 Planets Analysis entry form. Reuses ScoreRowsAnalysisFlow;
// only difference vs. Chakra is the row set + per-form copy.
// Marked "use client" because the config includes a function prop
// (notesPlaceholderFor) which can't cross the server→client boundary.

import {
  ScoreRowsAnalysisFlow,
  type ScoreRowDef,
} from "@/components/forms/ScoreRowsAnalysisFlow";
import { PLANETS } from "@/constants/planets";

const ROWS: readonly ScoreRowDef[] = PLANETS.map((p) => ({
  key: p.key,
  label: p.label,
  sanskrit: p.sanskrit || undefined,
  color: p.color,
}));

export default function PlanetsPage() {
  return (
    <ScoreRowsAnalysisFlow
      config={{
        pageTitle: "9 Planets Analysis",
        pageSubtitle:
          "Enter planetary energy values from −50 to +50 along with recommendations.",
        step2Heading: "Step 2 — Planetary energies",
        step2Subheading:
          "Range: −50 (heavily afflicted) to +50 (strongly favourable). 0 = neutral.",
        rows: ROWS,
        notesLabel: "Implementation / Recommendation",
        notesPlaceholderFor: (row) =>
          `Implementation / recommendation for ${row.label}…`,
        summaryPlaceholder:
          "Overall observation across all nine planets (2–4 paragraphs)…",
        generateButtonLabel: "Generate Planet Report",
        apiPath: "/api/analysis/planets",
        payloadRowsKey: "rows",
        savedHeading: "Planets entry saved",
      }}
    />
  );
}
