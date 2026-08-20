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
          "Record either Positive Energy or Negative Energy — never both. Geopathic Stress is separate and can always be scored. Sliders run 0 to +50 (positive, negative) and 0 to −50 (geopathic). These scores stay internal: the customer report shows positive energy as a percentage and the other two as “Detected” only — so don’t quote raw scores in the implications.",
        rows: ROWS,
        // A body scan shows either positive or negative energy, not a mix of
        // both, so entering one locks the other at 0.
        exclusiveGroups: [["positive_energy", "negative_energy"]],
        notesLabel: "Implication",
        // The customer sees this text verbatim next to a percentage or a bare
        // "Detected", so the placeholders steer the admin away from quoting
        // the raw score — the one place a hidden number could still leak.
        notesPlaceholderFor: (row) =>
          row.key === "positive_energy"
            ? "Implication for positive energy — refer to the percentage shown on the report, not the raw score…"
            : `Implication for ${row.label.toLowerCase()} — describe it without quoting a number; the report shows only “Detected”…`,
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
