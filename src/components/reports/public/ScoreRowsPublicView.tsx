// Generic HTML mirror of ScoreRowsReport for the public report page.
// Used by Chakra, Planets, Elements, Overall. Phase 11.4 Life Challenges
// and Phase 11.6 Wearables have their own views (different shape).

import { scoreToBarPosition } from "@/lib/score-color";

const NEUTRAL_BAR = "#E5E7EB";

export interface ScoreRowsPublicRow {
  key: string;
  label: string;
  sanskrit?: string;
  color: string;
  score: number;
  implication: string;
  /** Optional per-row axis. When set, the bar fills left-to-right over
   *  [min, max] (mirroring the app slider); otherwise it uses the −50…+50
   *  diverging style. */
  min?: number;
  max?: number;
}

function fmtAxis(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

function axisLabels(min?: number, max?: number): string[] {
  if (typeof min === "number" && typeof max === "number") {
    return [fmtAxis(min), fmtAxis(max)];
  }
  return ["−50", "0", "+50"];
}

export interface ScoreRowsPublicViewProps {
  /** e.g. "Chakra Energy Readings" */
  sectionHeading: string;
  /** Right-column heading: "Implication" / "Recommendation" */
  notesHeading: string;
  rows: ScoreRowsPublicRow[];
  summary: string;
}

function ScoreBar({
  score,
  color,
  min,
  max,
}: {
  score: number;
  color: string;
  min?: number;
  max?: number;
}) {
  // Ranged row (e.g. Free Basic Aura Check): left-to-right fill over [min, max],
  // matching the slider in the app form.
  if (typeof min === "number" && typeof max === "number") {
    const span = max - min || 1;
    const clamped = Math.max(min, Math.min(max, score));
    const fillPercent = ((clamped - min) / span) * 100;
    return (
      <div className="relative h-2.5 w-full rounded-full bg-[#E5E7EB]">
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: color,
            opacity: fillPercent === 0 ? 1 : 0.9,
          }}
        />
      </div>
    );
  }

  // Default axis (−50…+50): diverging bar centred at 0.
  const pos = scoreToBarPosition(score);
  const isPositive = score >= 0;
  const leftPercent = isPositive ? 50 : pos * 100;
  const widthPercent = Math.abs(pos - 0.5) * 100;
  // Negative scores render red (impactful); positive keep the row colour.
  const fillColor = score === 0 ? NEUTRAL_BAR : score < 0 ? "#E74C3C" : color;
  return (
    <div className="relative h-2.5 w-full rounded-full bg-[#E5E7EB]">
      <div className="absolute left-1/2 -top-1 -bottom-1 w-px bg-[#BBB3C7]" />
      <div
        className="absolute top-0 bottom-0 rounded-full"
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          backgroundColor: fillColor,
          opacity: score === 0 ? 1 : 0.9,
        }}
      />
    </div>
  );
}

export function ScoreRowsPublicView({
  sectionHeading,
  notesHeading,
  rows,
  summary,
}: ScoreRowsPublicViewProps) {
  return (
    <>
      <section className="rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
        <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
          {sectionHeading}
        </h2>
        <div className="mt-5 space-y-5">
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[180px_1fr_minmax(0,1fr)] gap-3 sm:gap-5 items-start border-b border-border/60 last:border-b-0 pb-5 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full shrink-0 shadow-inner"
                  style={{ background: r.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{r.label}</div>
                  {r.sanskrit ? (
                    <div className="text-xs italic text-muted-foreground">
                      {r.sanskrit}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 min-w-0">
                <ScoreBar
                  score={r.score}
                  color={r.color}
                  min={r.min}
                  max={r.max}
                />
                <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
                  <span>{axisLabels(r.min, r.max)[0]}</span>
                  <span
                    className="text-sm font-semibold text-foreground"
                    style={
                      r.min === undefined &&
                      r.max === undefined &&
                      r.score < 0
                        ? { color: "#E74C3C" }
                        : undefined
                    }
                  >
                    {r.score > 0 ? "+" : ""}
                    {r.score}
                  </span>
                  <span>{axisLabels(r.min, r.max).at(-1)}</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold tracking-[0.18em] text-aps-gold uppercase mb-1">
                  {notesHeading}
                </div>
                <p className="text-sm leading-relaxed">
                  {r.implication || (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
        <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
          Summary
        </h2>
        <div className="mt-3 rounded-lg bg-aps-card-alt p-4 whitespace-pre-wrap text-sm leading-relaxed">
          {summary}
        </div>
      </section>
    </>
  );
}
