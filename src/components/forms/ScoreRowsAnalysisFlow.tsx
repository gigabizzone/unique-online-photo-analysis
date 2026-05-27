"use client";

// Generalised client-side flow for any analysis form whose entry is a
// fixed list of "scored rows + notes" (Chakra, Planets, Elements,
// Overall). Phase 11.4 Life Challenges and Phase 11.6 Wearables have
// different row shapes and keep their own page files.
//
// What this component owns:
//   - Step 1: CustomerSearch + ProfileSection prefill / submit
//   - Step 2: render the fixed rows with ColoredSlider + a notes textarea
//   - Final Summary textarea + Generate button
//   - Two-step POST: save entry → generate PDF
//   - Success card with Download PDF / Send Email / Send via WhatsApp
//
// Variation knobs:
//   - apiPath, payloadRowsKey, pdfNameSlug ("Chakra entry" / "Planets entry")
//   - rows[] (label, sanskrit, color), per-form
//   - notesLabel + notesPlaceholderFor (e.g. "Implication" vs "Recommendation")
//   - copy strings: titles, generate button, summary placeholder

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  ProfileSection,
  type ProfileFormData,
} from "@/components/forms/ProfileSection";
import {
  CustomerSearch,
  type CustomerHit,
} from "@/components/forms/CustomerSearch";
import { ColoredSlider } from "@/components/forms/ColoredSlider";
import { AnalysisSuccessCard } from "@/components/forms/AnalysisSuccessCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScoreRowDef {
  key: string;
  label: string;
  sanskrit?: string;
  color: string;
}

export interface ScoreRowsFlowConfig {
  /** "9 Planets Analysis" */
  pageTitle: string;
  /** sentence under the title */
  pageSubtitle: string;
  /** Step 2 heading, e.g. "Step 2 — Planetary energies" */
  step2Heading: string;
  /** Step 2 helper text */
  step2Subheading: string;
  /** Fixed list of rows with label + colour */
  rows: readonly ScoreRowDef[];
  /** Label for the per-row notes textarea */
  notesLabel: string;
  /** Per-row placeholder for the notes textarea */
  notesPlaceholderFor: (row: ScoreRowDef) => string;
  /** Placeholder for the Final Summary textarea */
  summaryPlaceholder: string;
  /** Label for the green submit button at the bottom */
  generateButtonLabel: string;
  /** POST endpoint for the entry, e.g. "/api/analysis/planets" */
  apiPath: string;
  /** JSON key the API expects for the row array, e.g. "rows" or "chakras" */
  payloadRowsKey: string;
  /** Heading text on the green success card */
  savedHeading: string;
}

interface RowState {
  key: string;
  score: number;
  implication: string;
}

interface SaveResult {
  publicId: string;
  id: string;
  customerId: string;
  pdfStorageUrl?: string | null;
}

type Phase = "profile" | "entry" | "saved";

export function ScoreRowsAnalysisFlow({
  config,
}: {
  config: ScoreRowsFlowConfig;
}) {
  const [phase, setPhase] = useState<Phase>("profile");
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [preset, setPreset] = useState<Partial<ProfileFormData> | null>(null);
  const [rows, setRows] = useState<RowState[]>(
    config.rows.map((r) => ({ key: r.key, score: 0, implication: "" }))
  );
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveResult | null>(null);

  function handleProfileSubmit(data: ProfileFormData) {
    setProfile(data);
    setPhase("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRowChange(
    idx: number,
    field: "score" | "implication",
    value: string | number
  ) {
    setRows((curr) => {
      const next = [...curr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  async function handleGenerate() {
    if (!profile) return;
    setError(null);
    setSubmitting(true);
    try {
      const saveRes = await fetch(config.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          [config.payloadRowsKey]: rows,
          summary,
        }),
      });
      const saveBody = await saveRes.json();
      if (!saveRes.ok) {
        setError(saveBody.error ?? `Save failed (${saveRes.status})`);
        setSubmitting(false);
        return;
      }

      const genRes = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: saveBody.id }),
      });
      const genBody = await genRes.json();
      if (!genRes.ok) {
        setSaved({
          ...(saveBody as SaveResult),
          pdfStorageUrl: null,
        });
        setError(
          `Entry saved as ${saveBody.publicId} but PDF generation failed: ${genBody.error ?? genRes.status}. You can retry from the History page.`
        );
        setPhase("saved");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSaved({
        ...(saveBody as SaveResult),
        pdfStorageUrl: genBody.pdfStorageUrl,
      });
      setPhase("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    setProfile(null);
    setPreset(null);
    setRows(
      config.rows.map((r) => ({ key: r.key, score: 0, implication: "" }))
    );
    setSummary("");
    setSaved(null);
    setError(null);
    setPhase("profile");
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: saved
  // ─────────────────────────────────────────────────────────────
  if (phase === "saved" && saved) {
    return (
      <AnalysisSuccessCard
        saved={saved}
        heading={config.savedHeading}
        startAnotherLabel={`Enter another ${config.pageTitle.toLowerCase()} report`}
        warning={error}
        onStartAnother={startAnother}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE: profile (initial) or entry (after profile submit)
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            {config.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-white/60">{config.pageSubtitle}</p>
        </div>
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      {/* Step 1: CustomerSearch + ProfileSection */}
      <section className="rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold mb-1">
            Step 1 — Customer profile
          </h2>
          <p className="text-xs text-muted-foreground">
            Search for an existing customer or fill in the form below.
          </p>
        </div>
        <CustomerSearch onSelect={(c: CustomerHit) => setPreset(c)} />
        <ProfileSection
          preset={preset}
          onSubmit={handleProfileSubmit}
          submitLabel={
            phase === "entry" ? "Update and continue →" : "Submit and Next →"
          }
        />
      </section>

      {/* Step 2: scored rows */}
      <section
        className={cn(
          "rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm transition-opacity",
          phase === "profile" && "opacity-50 pointer-events-none select-none"
        )}
        aria-disabled={phase === "profile"}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold">{config.step2Heading}</h2>
          <p className="text-xs text-muted-foreground">
            {config.step2Subheading}
          </p>
        </div>

        <div className="space-y-5">
          {config.rows.map((row, i) => (
            <div
              key={row.key}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-5 items-start pb-5 border-b border-border last:border-b-0 last:pb-0"
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3 md:w-56">
                <div
                  className="h-8 w-8 rounded-full shrink-0 shadow-inner"
                  style={{ background: row.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{row.label}</div>
                  {row.sanskrit ? (
                    <div className="text-xs text-muted-foreground italic">
                      {row.sanskrit}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Slider + notes */}
              <div className="space-y-2">
                <ColoredSlider
                  color={row.color}
                  value={rows[i].score}
                  onChange={(n) => handleRowChange(i, "score", n)}
                />
                <textarea
                  value={rows[i].implication}
                  onChange={(e) =>
                    handleRowChange(i, "implication", e.target.value)
                  }
                  placeholder={config.notesPlaceholderFor(row)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-border">
          <label
            htmlFor="summary"
            className="block text-sm font-medium mb-1.5"
          >
            Final Summary *
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={config.summaryPlaceholder}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            variant="gold"
            size="lg"
            onClick={handleGenerate}
            disabled={
              phase === "profile" ||
              submitting ||
              summary.trim().length === 0
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              config.generateButtonLabel
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
