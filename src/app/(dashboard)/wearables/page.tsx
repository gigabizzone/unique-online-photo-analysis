"use client";

// PRD §6.6 — Wearable Items Analysis (Money Energy).
// Each row has TWO sliders (positive 0..+50, negative -50..0) plus a
// Money Energy Impact textarea. Below the table, 5 numbered Remarks /
// Recommendations text inputs.

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
  WEARABLE_DEFAULTS,
  POSITIVE_COLOR,
  NEGATIVE_COLOR,
  colorForWearableRow,
} from "@/constants/wearables";
import { cn } from "@/lib/utils";

interface WearableRowState {
  name: string;
  positiveScore: number;
  negativeScore: number;
  moneyEnergy: string;
}

function emptyRow(): WearableRowState {
  return { name: "", positiveScore: 0, negativeScore: 0, moneyEnergy: "" };
}

type Phase = "profile" | "entry" | "saved";

export default function WearablesPage() {
  const [phase, setPhase] = useState<Phase>("profile");
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [preset, setPreset] = useState<Partial<ProfileFormData> | null>(null);
  const [rows, setRows] = useState<WearableRowState[]>(
    Array.from({ length: WEARABLE_DEFAULTS.initialRows }, emptyRow)
  );
  const [remarks, setRemarks] = useState<string[]>(
    Array.from({ length: WEARABLE_DEFAULTS.remarksCount }, () => "")
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

  function updateRow<K extends keyof WearableRowState>(
    idx: number,
    field: K,
    value: WearableRowState[K]
  ) {
    setRows((curr) => {
      const next = [...curr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addRow() {
    setRows((curr) =>
      curr.length >= WEARABLE_DEFAULTS.maxRows ? curr : [...curr, emptyRow()]
    );
  }

  function removeRow(idx: number) {
    setRows((curr) =>
      curr.length <= WEARABLE_DEFAULTS.minRows
        ? curr
        : curr.filter((_, i) => i !== idx)
    );
  }

  function updateRemark(idx: number, value: string) {
    setRemarks((curr) => {
      const next = [...curr];
      next[idx] = value;
      return next;
    });
  }

  async function handleGenerate() {
    if (!profile) return;
    const submittableRows = rows.filter(
      (r) =>
        r.name.trim().length > 0 ||
        r.moneyEnergy.trim().length > 0 ||
        r.positiveScore !== 0 ||
        r.negativeScore !== 0
    );
    if (submittableRows.length === 0) {
      setError("Please add at least one wearable item with a name.");
      return;
    }
    if (submittableRows.some((r) => r.name.trim().length === 0)) {
      setError("Every row must have an item name (or remove the empty row).");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const saveRes = await fetch("/api/analysis/wearables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          rows: submittableRows,
          remarks,
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
    setRows(Array.from({ length: WEARABLE_DEFAULTS.initialRows }, emptyRow));
    setRemarks(
      Array.from({ length: WEARABLE_DEFAULTS.remarksCount }, () => "")
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
        heading="Money Energy entry saved"
        startAnotherLabel="Enter another money energy report"
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
            Wearable Items Analysis
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Money Energy reading per object — positive + negative scores
            and an impact note for each.
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
            <h2 className="text-base font-semibold">Step 2 — Wearable items</h2>
            <p className="text-xs text-muted-foreground">
              {WEARABLE_DEFAULTS.minRows}–{WEARABLE_DEFAULTS.maxRows} items.
              Positive 0→+50 (green), Negative 0→−50 (red).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= WEARABLE_DEFAULTS.maxRows}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add item ({rows.length}/{WEARABLE_DEFAULTS.maxRows})
          </Button>
        </div>

        <div className="space-y-6">
          {rows.map((row, i) => {
            const color = colorForWearableRow(i);
            return (
              <div
                key={i}
                className="space-y-3 pb-6 border-b border-border last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-8 w-8 rounded-full shrink-0 shadow-inner mt-1 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: color }}
                    aria-hidden
                  >
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                    placeholder={`Item / object name #${i + 1} (e.g. gold ring, rudraksha mala, copper bracelet)`}
                    maxLength={160}
                    className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= WEARABLE_DEFAULTS.minRows}
                    aria-label={`Remove item ${i + 1}`}
                    className="mt-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-emerald-700 mb-1.5">
                      Positive Energy (0 → +50)
                    </div>
                    <ColoredSlider
                      color={POSITIVE_COLOR}
                      min={0}
                      max={50}
                      value={row.positiveScore}
                      onChange={(n) => updateRow(i, "positiveScore", n)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-red-700 mb-1.5">
                      Negative Energy (0 → −50)
                    </div>
                    <ColoredSlider
                      color={NEGATIVE_COLOR}
                      min={-50}
                      max={0}
                      value={row.negativeScore}
                      onChange={(n) => updateRow(i, "negativeScore", n)}
                    />
                  </div>
                </div>

                <div className="ml-11">
                  <label className="block text-xs font-medium mb-1">
                    Money Energy Impact
                  </label>
                  <textarea
                    value={row.moneyEnergy}
                    onChange={(e) =>
                      updateRow(i, "moneyEnergy", e.target.value)
                    }
                    placeholder="How this object influences money flow / abundance / drains…"
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Remarks / Recommendations — fixed 5 slots */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-1">
            Remarks / Recommendations
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Up to {WEARABLE_DEFAULTS.remarksCount} numbered remarks for the
            customer. Leave any line blank if not needed.
          </p>
          <div className="space-y-2">
            {remarks.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 text-sm text-muted-foreground text-right select-none">
                  {i + 1}.
                </div>
                <input
                  type="text"
                  value={r}
                  onChange={(e) => updateRemark(i, e.target.value)}
                  placeholder={`Remark ${i + 1}…`}
                  maxLength={500}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Final Summary */}
        <div className="mt-6 pt-6 border-t border-border">
          <label htmlFor="summary" className="block text-sm font-medium mb-1.5">
            Final Summary *
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Overall money-energy observation across all wearable items (2–4 paragraphs)…"
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
              "Generate Money Energy Report"
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
