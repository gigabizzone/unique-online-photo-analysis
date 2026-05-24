"use client";

// PRD §6.1 — 7 Chakra Analysis entry form.
// UX flow on a single page:
//   1. ProfileSection (customer details) + optional CustomerSearch prefill
//   2. After "Submit and Next", reveal the chakra table + Summary
//   3. "Generate Report" POSTs to /api/analysis/chakra → success card
//
// The PDF/email/WhatsApp actions on the success card are wired up in
// Phase 7+; for now the card just confirms the entry was saved.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

import {
  ProfileSection,
  type ProfileFormData,
} from "@/components/forms/ProfileSection";
import {
  CustomerSearch,
  type CustomerHit,
} from "@/components/forms/CustomerSearch";
import { ColoredSlider } from "@/components/forms/ColoredSlider";
import { Button } from "@/components/ui/button";
import { CHAKRAS } from "@/constants/chakras";
import { cn } from "@/lib/utils";

interface ChakraRowState {
  key: string;
  score: number;
  implication: string;
}

interface SaveResult {
  publicId: string;
  id: string;
  customerId: string;
}

type Phase = "profile" | "entry" | "saved";

export default function ChakraPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("profile");
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [preset, setPreset] = useState<Partial<ProfileFormData> | null>(null);
  const [rows, setRows] = useState<ChakraRowState[]>(
    CHAKRAS.map((c) => ({ key: c.key, score: 0, implication: "" }))
  );
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveResult | null>(null);

  function handleProfileSubmit(data: ProfileFormData) {
    setProfile(data);
    setPhase("entry");
    // Scroll to the chakra section
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
      const res = await fetch("/api/analysis/chakra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          chakras: rows,
          summary,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Save failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      setSaved(body as SaveResult);
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
    setRows(CHAKRAS.map((c) => ({ key: c.key, score: 0, implication: "" })));
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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl bg-white text-foreground p-6 sm:p-8 shadow-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
            <div>
              <h2 className="text-xl font-semibold">Chakra entry saved</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Stored in Supabase under report ID{" "}
                <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                  {saved.publicId}
                </code>
                .
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p>
              <strong>Phase 7 will replace this card</strong> with a Download
              PDF / Send Email / Send via WhatsApp action panel. For now the
              entry is persisted and accessible via the History page (Phase 12)
              or directly in Supabase Table Editor.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={startAnother} variant="gold">
              Enter another chakra report
            </Button>
            <Link href="/">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </main>
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
            7 Chakra Analysis
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Enter chakra energy values from −50 to +50 and their implications.
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

      {/* CustomerSearch + ProfileSection */}
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
          submitLabel={phase === "entry" ? "Update and continue →" : "Submit and Next →"}
        />
      </section>

      {/* Chakra entry table — only enabled after profile submit */}
      <section
        className={cn(
          "rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm transition-opacity",
          phase === "profile" && "opacity-50 pointer-events-none select-none"
        )}
        aria-disabled={phase === "profile"}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold">Step 2 — Chakra energies</h2>
          <p className="text-xs text-muted-foreground">
            Range: −50 (deeply blocked) to +50 (radiantly open). 0 = neutral.
          </p>
        </div>

        <div className="space-y-5">
          {CHAKRAS.map((c, i) => (
            <div
              key={c.key}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-5 items-start pb-5 border-b border-border last:border-b-0 last:pb-0"
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3 md:w-56">
                <div
                  className="h-8 w-8 rounded-full shrink-0 shadow-inner"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground italic">
                    {c.sanskrit}
                  </div>
                </div>
              </div>

              {/* Slider + implication */}
              <div className="space-y-2">
                <ColoredSlider
                  color={c.color}
                  value={rows[i].score}
                  onChange={(n) => handleRowChange(i, "score", n)}
                />
                <textarea
                  value={rows[i].implication}
                  onChange={(e) =>
                    handleRowChange(i, "implication", e.target.value)
                  }
                  placeholder={`Implication for ${c.label.toLowerCase()} (2–4 lines)`}
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
            placeholder="Overall observation across all seven chakras (2–4 paragraphs)…"
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
              "Generate Report"
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
