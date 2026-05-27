// HTML mirror of the Chakra PDF for the public report page.
// Same structural content as src/components/reports/ChakraReport.tsx (the
// @react-pdf version) but adapted to HTML + Tailwind. Customers scanning
// the QR see this in their phone browser — should work without auth and
// look reasonable on small screens.
//
// The chakra rows are typed loosely (Record<string, unknown>) because
// AnalysisEntry.data is a Prisma Json field; we re-narrow at the call
// site.

import { scoreToBarPosition } from "@/lib/score-color";

const NEUTRAL_BAR = "#E5E7EB";

export interface ChakraPublicRow {
  key: string;
  label: string;
  sanskrit: string;
  color: string;
  score: number;
  implication: string;
}

export interface ChakraPublicViewProps {
  rows: ChakraPublicRow[];
  summary: string;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pos = scoreToBarPosition(score); // 0..1
  const isPositive = score >= 0;
  const leftPercent = isPositive ? 50 : pos * 100;
  const widthPercent = Math.abs(pos - 0.5) * 100;
  const fillColor = score === 0 ? NEUTRAL_BAR : color;

  return (
    <div className="relative h-2.5 w-full rounded-full bg-[#E5E7EB]">
      {/* Centre tick */}
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

export function ChakraPublicView({ rows, summary }: ChakraPublicViewProps) {
  return (
    <>
      <section className="rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
        <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
          Chakra Energy Readings
        </h2>
        <div className="mt-5 space-y-5">
          {rows.map((c) => (
            <div
              key={c.key}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[180px_1fr_minmax(0,1fr)] gap-3 sm:gap-5 items-start border-b border-border/60 last:border-b-0 pb-5 last:pb-0"
            >
              {/* Swatch + name */}
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full shrink-0 shadow-inner"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.label}</div>
                  <div className="text-xs italic text-muted-foreground">
                    {c.sanskrit}
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <ScoreBar score={c.score} color={c.color} />
                <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
                  <span>−50</span>
                  <span className="text-sm font-semibold text-foreground">
                    {c.score > 0 ? "+" : ""}
                    {c.score}
                  </span>
                  <span>+50</span>
                </div>
              </div>

              {/* Implication */}
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold tracking-[0.18em] text-aps-gold uppercase mb-1">
                  Implication
                </div>
                <p className="text-sm leading-relaxed">
                  {c.implication || (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary */}
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
