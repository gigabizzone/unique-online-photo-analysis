// HTML public view for the Wearable Items / Money Energy report.
// Used by /report/[publicId] when analysisType === "WEARABLES".

import type { RowDisplay } from "@/lib/report-display";

const POSITIVE_COLOR = "#2ECC71";
const NEGATIVE_COLOR = "#E74C3C";

export interface WearableItemPublic {
  key: string;
  name: string;
  color: string;
  moneyEnergy: string;
  /** Single -50..+50 reading. Present on entries saved after the twin-slider
   *  form was replaced; absent on legacy entries. */
  score?: number;
  /** Legacy twin scores, kept so already-delivered reports still render. */
  positiveScore?: number;
  negativeScore?: number;
  /** v2 entries only: percentage (with bar) or "Negative Energy Detected". */
  display?: RowDisplay;
}

export interface WearablesPublicViewProps {
  items: WearableItemPublic[];
  remarks: string[];
  summary: string;
}

function HBar({
  value,
  color,
  scale, // "+50" or "-50"
}: {
  value: number;
  color: string;
  scale: string;
}) {
  const widthPct = (Math.min(50, Math.abs(value)) / 50) * 100;
  return (
    <div>
      <div className="relative h-2.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full"
          style={{ width: `${widthPct}%`, background: color, opacity: 0.9 }}
        />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-sm font-semibold text-foreground">
          {value > 0 ? "+" : ""}
          {value}
        </span>
        <span>{scale}</span>
      </div>
    </div>
  );
}

export function WearablesPublicView({
  items,
  remarks,
  summary,
}: WearablesPublicViewProps) {
  const nonEmptyRemarks = remarks
    .map((r, i) => ({ text: r.trim(), idx: i }))
    .filter((r) => r.text.length > 0);

  return (
    <>
      <section className="rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
        <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
          Wearable Items
        </h2>
        <div className="mt-5 space-y-6">
          {items.map((it, i) => (
            // Same three-column shape as ScoreRowsPublicView (Chakra /
            // Planets / Elements): name, reading, notes.
            <div
              key={it.key}
              className="grid grid-cols-[auto_1fr] sm:grid-cols-[180px_1fr_minmax(0,1fr)] gap-3 sm:gap-5 items-start border-b border-border/60 last:border-b-0 pb-5 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-7 w-7 rounded-full shrink-0 shadow-inner flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: it.color }}
                  aria-hidden
                >
                  {i + 1}
                </div>
                <div className="min-w-0 text-sm font-semibold">{it.name}</div>
              </div>

              <div className="col-span-2 sm:col-span-1 min-w-0">
                {it.display?.mode === "percent" ? (
                  // One reading per object: a share of the positive half-axis,
                  // with a bar, exactly as a chakra reads.
                  <>
                    <div className="relative h-2.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                      <div
                        className="absolute top-0 left-0 bottom-0 rounded-full"
                        style={{
                          width: `${it.display.percent}%`,
                          background: POSITIVE_COLOR,
                          opacity: 0.9,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: POSITIVE_COLOR }}
                      >
                        {it.display.percent}%
                        {it.display.suffix ? ` ${it.display.suffix}` : ""}
                      </span>
                      <span>100%</span>
                    </div>
                  </>
                ) : it.display?.mode === "detect" ? (
                  // No bar and no number — the score stays an admin-side record.
                  <p
                    className="text-sm font-semibold"
                    style={{ color: NEGATIVE_COLOR }}
                  >
                    {it.display.text}
                  </p>
                ) : (
                  // Legacy entry: twin positive/negative bars, as delivered.
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: POSITIVE_COLOR }}>
                        Positive Energy
                      </div>
                      <HBar value={it.positiveScore ?? 0} color={POSITIVE_COLOR} scale="+50" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: NEGATIVE_COLOR }}>
                        Negative Energy
                      </div>
                      <HBar value={it.negativeScore ?? 0} color={NEGATIVE_COLOR} scale="−50" />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold tracking-[0.18em] text-aps-gold uppercase mb-1">
                  Money Energy Impact
                </div>
                <p className="text-sm leading-relaxed">
                  {it.moneyEnergy || (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {nonEmptyRemarks.length > 0 && (
        <section className="mt-6 rounded-xl bg-white text-aps-text-light-bg p-5 sm:p-7 shadow-lg">
          <h2 className="text-xs font-bold tracking-[0.18em] text-aps-gold uppercase">
            Remarks / Recommendations
          </h2>
          <ol className="mt-3 space-y-1.5">
            {nonEmptyRemarks.map(({ text, idx }) => (
              <li key={idx} className="flex gap-2 text-sm leading-relaxed">
                <span className="w-5 shrink-0 text-aps-gold font-semibold">
                  {idx + 1}.
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

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
