// Client-approved clarifying "scale note" shown at the END of the four
// scored-rows reports (Chakra, Planets, Elements, Life Challenges). The noun
// swaps per report type. Free Basic Aura Check & Wearables use different
// scales/formats and do NOT show this note.
//
// One source of truth so the PDF and the public web report stay identical.

export function buildScaleNote(noun: string): string {
  return `All ${noun} are scored from 0 to 50, positive or negative — a '+' sign marks positive readings, while negative readings (shown in red) should be corrected on priority to balance your Aura, ideally by raising each into the strong positive range of +40 to +50 for the best overall results.`;
}
