// HTML mirror of the Planets PDF for the public report page.
// Mirrors ChakraPublicView with the section heading + per-row notes
// label swapped (Recommendation vs Implication).

import { scoreToBarPosition } from "@/lib/score-color";

const NEUTRAL_BAR = "#E5E7EB";

export interface PlanetPublicRow {
  key: string;
  label: string;
  sanskrit: string;
  color: string;
  score: number;
  implication: string;
}

export interface PlanetsPublicViewProps {
  rows: PlanetPublicRow[];
  summary: string;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pos = scoreToBarPosition(score);
  const isPositive = score >= 0;
  const leftPercent = isPositive ? 50 : pos * 100;
  const widthPercent = Math.abs(pos - 0.5) * 100;
  const fillColor = score === 0 ? NEUTRAL_BAR : color;
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

export function PlanetsPublicView({ rows, summary }: PlanetsPublicViewProps) {
  return (
    <>
      <section className="rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
        <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
          Planetary Energy Readings
        </h2>
        <div className="mt-5 space-y-5">
          {rows.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[180px_1fr_minmax(0,1fr)] gap-3 sm:gap-5 items-start border-b border-border/60 last:border-b-0 pb-5 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full shrink-0 shadow-inner"
                  style={{ background: p.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{p.label}</div>
                  {p.sanskrit ? (
                    <div className="text-xs italic text-muted-foreground">
                      {p.sanskrit}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 min-w-0">
                <ScoreBar score={p.score} color={p.color} />
                <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
                  <span>−50</span>
                  <span className="text-sm font-semibold text-foreground">
                    {p.score > 0 ? "+" : ""}
                    {p.score}
                  </span>
                  <span>+50</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold tracking-[0.18em] text-aps-gold uppercase mb-1">
                  Recommendation
                </div>
                <p className="text-sm leading-relaxed">
                  {p.implication || (
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
