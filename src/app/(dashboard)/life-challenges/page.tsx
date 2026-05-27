"use client";

// PRD §6.4 — Life Challenges Analysis. Unlike the four "preset row" forms
// (Chakra/Planets/Elements/Overall), the rows here are dynamic: the
// admin types each challenge name. Starts at 7 rows, +Add Row up to 12,
// minimum 1 row.
//
// Score range is the universal −50 to +50 per PRD §3.7. 0 = neutral,
// negative = adverse impact, positive = the customer is handling that
// challenge well.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import {
  ProfileSection,
  type ProfileFormData,
} from "@/components/forms/ProfileSection";
import {
  CustomerSearch,
  type CustomerHit,
} from "@/components/forms/CustomerSearch";
import { ColoredSlider } from "@/components/forms/ColoredSlider";
import {
  AnalysisSuccessCard,
  type SavedAnalysis,
} from "@/components/forms/AnalysisSuccessCard";
import { Button } from "@/components/ui/button";
import {
  LIFE_CHALLENGE_DEFAULTS,
  colorForLifeChallengeRow,
} from "@/constants/life-challenges";
import { cn } from "@/lib/utils";

interface ChallengeRowState {
  label: string;
  score: number;
  implication: string;
}

function emptyRow(): ChallengeRowState {
  return { label: "", score: 0, implication: "" };
}

type Phase = "profile" | "entry" | "saved";

export default function LifeChallengesPage() {
  const [phase, setPhase] = useState<Phase>("profile");
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [preset, setPreset] = useState<Partial<ProfileFormData> | null>(null);
  const [rows, setRows] = useState<ChallengeRowState[]>(
    Array.from({ length: LIFE_CHALLENGE_DEFAULTS.initialRows }, emptyRow)
  );
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<
    (SavedAnalysis & { customerId: string }) | null
  >(null);

  function handleProfileSubmit(data: ProfileFormData) {
    setProfile(data);
    setPhase("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRow(
    idx: number,
    field: keyof ChallengeRowState,
    value: string | number
  ) {
    setRows((curr) => {
      const next = [...curr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addRow() {
    setRows((curr) =>
      curr.length >= LIFE_CHALLENGE_DEFAULTS.maxRows ? curr : [...curr, emptyRow()]
    );
  }

  function removeRow(idx: number) {
    setRows((curr) =>
      curr.length <= LIFE_CHALLENGE_DEFAULTS.minRows
        ? curr
        : curr.filter((_, i) => i !== idx)
    );
  }

  async function handleGenerate() {
    if (!profile) return;
    // Strip empty rows (no label and no implication and score = 0).
    const submittableRows = rows.filter(
      (r) =>
        r.label.trim().length > 0 ||
        r.implication.trim().length > 0 ||
        r.score !== 0
    );
    if (submittableRows.length === 0) {
      setError("Please add at least one challenge with a name.");
      return;
    }
    // Every kept row must have a name.
    if (submittableRows.some((r) => r.label.trim().length === 0)) {
      setError("Every row must have a challenge name (or remove the empty row).");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const saveRes = await fetch("/api/analysis/life-challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, rows: submittableRows, summary }),
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
        setSaved({ ...saveBody, pdfStorageUrl: null });
        setError(
          `Entry saved as ${saveBody.publicId} but PDF generation failed: ${genBody.error ?? genRes.status}. You can retry from the History page.`
        );
        setPhase("saved");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSaved({ ...saveBody, pdfStorageUrl: genBody.pdfStorageUrl });
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
      Array.from({ length: LIFE_CHALLENGE_DEFAULTS.initialRows }, emptyRow)
    );
    setSummary("");
    setSaved(null);
    setError(null);
    setPhase("profile");
  }

  if (phase === "saved" && saved) {
    return (
      <AnalysisSuccessCard
        saved={saved}
        heading="Life Challenges entry saved"
        startAnotherLabel="Enter another life challenges report"
        warning={error}
        onStartAnother={startAnother}
      />
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Life Challenges Analysis
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Type each challenge name, rate its severity, and add an implication.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

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

      <section
        className={cn(
          "rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm transition-opacity",
          phase === "profile" && "opacity-50 pointer-events-none select-none"
        )}
        aria-disabled={phase === "profile"}
      >
        <div className="mb-4 flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold">Step 2 — Life challenges</h2>
            <p className="text-xs text-muted-foreground">
              {LIFE_CHALLENGE_DEFAULTS.minRows}–
              {LIFE_CHALLENGE_DEFAULTS.maxRows} rows. Severity range: −50 (most
              adverse) to +50 (already overcoming). 0 = neutral.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= LIFE_CHALLENGE_DEFAULTS.maxRows}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add row ({rows.length}/{LIFE_CHALLENGE_DEFAULTS.maxRows})
          </Button>
        </div>

        <div className="space-y-5">
          {rows.map((row, i) => {
            const color = colorForLifeChallengeRow(i);
            return (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 pb-5 border-b border-border last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-8 w-8 rounded-full shrink-0 shadow-inner mt-1 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: color }}
                    aria-hidden
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(i, "label", e.target.value)}
                      placeholder={`Challenge name #${i + 1} (e.g. financial stress, health issue, relationship strain)`}
                      maxLength={160}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <ColoredSlider
                      color={color}
                      value={row.score}
                      onChange={(n) => updateRow(i, "score", n)}
                    />
                    <textarea
                      value={row.implication}
                      onChange={(e) =>
                        updateRow(i, "implication", e.target.value)
                      }
                      placeholder={`Implication / recommendation for this challenge…`}
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= LIFE_CHALLENGE_DEFAULTS.minRows}
                    aria-label={`Remove challenge ${i + 1}`}
                    className="mt-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <label htmlFor="summary" className="block text-sm font-medium mb-1.5">
            Final Summary *
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Overall observation across all life challenges (2–4 paragraphs)…"
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
              "Generate Life Challenges Report"
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
