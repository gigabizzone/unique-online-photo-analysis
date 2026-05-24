"use client";

// Developer-facing demo: exercises ProfileSection, ColoredSlider,
// CustomerSearch, and SocialFooter so they can be eyeballed without
// having to build the real /chakra page yet. Auth-gated by the parent
// (dashboard)/layout.tsx — not reachable to anonymous visitors.
//
// Will be deleted (or hidden behind an env flag) before go-live.

import { useState } from "react";

import { ProfileSection, type ProfileFormData } from "@/components/forms/ProfileSection";
import { ColoredSlider } from "@/components/forms/ColoredSlider";
import {
  CustomerSearch,
  type CustomerHit,
} from "@/components/forms/CustomerSearch";

// Chakra palette per PRD §3.5 — used to demo per-slider tinting.
const CHAKRAS = [
  { name: "Crown (Sahasrara)", color: "#8E44AD" },
  { name: "Third Eye (Ajna)", color: "#4B0082" },
  { name: "Throat (Vishuddha)", color: "#1E90FF" },
  { name: "Heart (Anahata)", color: "#2ECC71" },
  { name: "Solar Plexus (Manipura)", color: "#F1C40F" },
  { name: "Sacral (Svadhisthana)", color: "#E67E22" },
  { name: "Root (Muladhara)", color: "#E74C3C" },
] as const;

export default function DemoPage() {
  const [sliderValues, setSliderValues] = useState<number[]>(
    CHAKRAS.map(() => 0)
  );
  const [preset, setPreset] = useState<Partial<ProfileFormData> | null>(null);
  const [lastSubmit, setLastSubmit] = useState<ProfileFormData | null>(null);

  function handleSliderChange(idx: number, next: number) {
    setSliderValues((curr) => {
      const copy = [...curr];
      copy[idx] = next;
      return copy;
    });
  }

  function handleCustomerSelect(c: CustomerHit) {
    setPreset({
      firstName: c.firstName,
      lastName: c.lastName,
      gender: c.gender as ProfileFormData["gender"],
      email: c.email,
      whatsapp: c.whatsapp,
    });
  }

  function handleSubmit(data: ProfileFormData) {
    setLastSubmit(data);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-white">
          Component demo (Phase 5)
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Eyeball-only page for the four reusable form components. Not part of
          the production app.
        </p>
      </header>

      {/* ── ColoredSlider with each chakra color ── */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white mb-1">
          ColoredSlider
        </h2>
        <p className="text-xs text-white/60 mb-4">
          One per chakra color. Try dragging the thumb or typing in the box —
          they should stay in sync. Range is −50 to +50.
        </p>
        <div className="space-y-4 rounded-lg bg-white p-5 text-foreground">
          {CHAKRAS.map((c, i) => (
            <ColoredSlider
              key={c.name}
              label={c.name}
              color={c.color}
              value={sliderValues[i]}
              onChange={(n) => handleSliderChange(i, n)}
            />
          ))}
        </div>
      </section>

      {/* ── CustomerSearch + ProfileSection ── */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white mb-1">
          CustomerSearch → ProfileSection
        </h2>
        <p className="text-xs text-white/60 mb-4">
          Type 2+ characters of a name / email / WhatsApp. Picking a result
          should prefill the form below.
        </p>
        <div className="space-y-4 rounded-lg bg-white p-5 text-foreground">
          <CustomerSearch onSelect={handleCustomerSelect} />
          <ProfileSection
            preset={preset}
            onSubmit={handleSubmit}
            submitLabel="Submit (demo)"
          />
        </div>

        {lastSubmit && (
          <div className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-100">
            Last submit:
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(lastSubmit, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <p className="text-xs text-white/40 text-center">
        SocialFooter is rendered globally on every dashboard page by the layout
        — scroll to the bottom to see it.
      </p>
    </main>
  );
}
