// Customer-facing presentation rules for the scored-row reports.
//
// Client decisions (2026-08-20), driven by non-technical customers misreading
// raw scores — a reading of +25 was being understood as "25%" when it is
// actually half of the 0..50 scale.
//
// Free Basic Aura Check (OVERALL), rows on fixed per-row axes:
//   - Positive Energy  -> percentage, NO bar. Zero reads "Not Detected".
//   - Negative Energy  -> "Detected" / "Not Detected", no bar, no number.
//   - Geopathic Stress -> "Detected" / "Not Detected", no bar, no number.
//
// Chakra / Planets / Elements / Life Challenges (POLARITY), rows on a -50..+50
// axis where every row always lands on one side or the other:
//   - score >  0 -> "<pct>% Positive" WITH a 0-100% bar.
//   - score <= 0 -> "Negative Energy Detected", no bar, no number.
//     Zero counts as negative: a row with no positive energy is a deficit to
//     correct, and these reports never show "Not Detected".
//
// In every case the raw score stays in the database for the admin's records
// and never reaches the customer.
//
// Only entries stamped formatVersion >= REPORT_FORMAT_VERSION render this way.
// Entries saved earlier keep their original bars and numbers, so report links
// already delivered to customers are never altered retroactively.

import { OVERALL_RANGE_BY_KEY } from "@/constants/overall";

export const REPORT_FORMAT_VERSION = 2;

/** Widest half-axis of a scored row: 0..50 positive, 0..-50 negative. */
const HALF_AXIS = 50;

export type RowDisplay =
  /** A percentage reading. `bar` decides whether a 0-100% bar is drawn with
   *  it; `suffix` appends a word such as "Positive" after the figure. */
  | { mode: "percent"; percent: number; suffix?: string; bar: boolean }
  /** A presence statement — no bar and no number, ever. */
  | { mode: "detect"; detected: boolean; text: string };

/** True when a stored `data` payload should use the v2 presentation. */
export function isReportV2(data: unknown): boolean {
  const v = (data as { formatVersion?: unknown } | null)?.formatVersion;
  return typeof v === "number" && v >= REPORT_FORMAT_VERSION;
}

/** Analysis types that share the -50..+50 polarity presentation.
 *  Life Challenges has admin-typed rows rather than fixed ones, but its
 *  severity axis runs the same way (-50 most adverse .. +50 overcoming) and
 *  it renders through the same report components. */
export const POLARITY_TYPES = [
  "CHAKRA",
  "PLANETS",
  "ELEMENTS",
  "LIFE_CHALLENGES",
] as const;

export function isPolarityType(t: string): boolean {
  return (POLARITY_TYPES as readonly string[]).includes(t);
}

// ─── Free Basic Aura Check (OVERALL) ──────────────────────────────────────

/**
 * How one Free Basic Aura Check row reads to the customer.
 *
 * Positive Energy is the only row that ever shows a magnitude, and only when
 * it carries one. Everything else is a presence/absence statement. No bars —
 * the percentage stands on its own and bars stay in the admin form.
 */
export function overallRowDisplay(
  key: string,
  score: number,
  label: string
): RowDisplay {
  if (key === "positive_energy" && score > 0) {
    const range = OVERALL_RANGE_BY_KEY[key];
    const span = range ? range.max - range.min : HALF_AXIS;
    return {
      mode: "percent",
      percent: span > 0 ? Math.round((score / span) * 100) : 0,
      bar: false,
    };
  }

  // Geopathic Stress runs 0..-50, so presence is any non-zero reading.
  const detected = score !== 0;
  return {
    mode: "detect",
    detected,
    text: `${label} ${detected ? "Detected" : "Not Detected"}`,
  };
}

/**
 * Attach each row's score axis and — for v2 entries — its display directive.
 *
 * Ranges are looked up by key rather than trusted from the persisted payload,
 * so entries saved before per-row ranges existed still render correctly.
 */
export function enrichOverallRows<
  T extends { key: string; label: string; score: number },
>(
  rows: T[],
  isV2: boolean
): (T & { min?: number; max?: number; display?: RowDisplay })[] {
  return rows.map((r) => ({
    ...r,
    ...(OVERALL_RANGE_BY_KEY[r.key] ?? {}),
    ...(isV2 ? { display: overallRowDisplay(r.key, r.score, r.label) } : {}),
  }));
}

// ─── Chakra / Planets / Elements / Life Challenges (-50..+50) ─────────────

/**
 * How one chakra / planet / element / life challenge reads to the customer.
 *
 * Above zero is reported as a share of the positive half-axis (+25 of 50 is
 * "50% Positive") and keeps a bar, because a strong reading is good news
 * worth showing. Zero and below is reported only as a detection, with no bar
 * and no number, so the customer never learns how negative it is.
 */
export function polarityRowDisplay(score: number): RowDisplay {
  if (score > 0) {
    return {
      mode: "percent",
      percent: Math.round((Math.min(score, HALF_AXIS) / HALF_AXIS) * 100),
      suffix: "Positive",
      bar: true,
    };
  }
  return { mode: "detect", detected: true, text: "Negative Energy Detected" };
}

export function enrichPolarityRows<T extends { score: number }>(
  rows: T[],
  isV2: boolean
): (T & { display?: RowDisplay })[] {
  return rows.map((r) => ({
    ...r,
    ...(isV2 ? { display: polarityRowDisplay(r.score) } : {}),
  }));
}

// ─── Wearable items / Money Energy ────────────────────────────────────────

/**
 * Wearable items read on the same rules as a chakra, but they live in their
 * own report template alongside a Money Energy note, so they get their own
 * enrichment step.
 *
 * Legacy entries stored a PAIR of scores — `positiveScore` (0..+50) and
 * `negativeScore` (-50..0) — which let one object hold both at once. Those
 * entries have no formatVersion and keep rendering their original twin bars.
 * The fallback below only matters if such an entry were ever re-stamped: it
 * folds the pair back onto one axis by taking whichever side was actually set.
 */
export function enrichWearableItems<
  T extends {
    score?: number;
    positiveScore?: number;
    negativeScore?: number;
  },
>(items: T[], isV2: boolean): (T & { display?: RowDisplay })[] {
  return items.map((it) => {
    if (!isV2) return { ...it };
    const score =
      typeof it.score === "number"
        ? it.score
        : (it.positiveScore ?? 0) > 0
          ? (it.positiveScore as number)
          : (it.negativeScore ?? 0);
    return { ...it, display: polarityRowDisplay(score) };
  });
}
