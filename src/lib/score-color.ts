// PRD §3.7 — universal score → colour mapping. -50..0..+50 → red..none..green
// with intensity proportional to distance from 0.
//
// `scoreToRgba` returns the PRD-spec rgba expression, used for *gradient* /
// translucent fills. `scoreToHex` is a solid-colour fallback for places that
// can't render alpha (e.g. some PDF renderers, badge text colours).

const RED_RGB = "231, 76, 60";
const GREEN_RGB = "46, 204, 113";

export function scoreToRgba(score: number): string {
  if (score === 0) return "transparent";
  const intensity = Math.min(Math.abs(score) / 50, 1);
  return score < 0
    ? `rgba(${RED_RGB}, ${intensity})`
    : `rgba(${GREEN_RGB}, ${intensity})`;
}

export function scoreToHex(score: number): string {
  if (score === 0) return "#E5E7EB"; // neutral gray
  return score < 0 ? "#E74C3C" : "#2ECC71";
}

/**
 * Position (0 to 1) on a -50..+50 axis. 0 → centre (0.5), -50 → 0.0, +50 → 1.0.
 * Used to place markers on horizontal progress bars in the PDF.
 */
export function scoreToBarPosition(score: number): number {
  const clamped = Math.max(-50, Math.min(50, score));
  return (clamped + 50) / 100;
}
