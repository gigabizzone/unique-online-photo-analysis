// Client-approved clarifying "scale note" shown at the END of the four
// scored-rows reports (Chakra, Planets, Elements, Life Challenges). The noun
// swaps per report type. Free Basic Aura Check & Wearables use different
// scales/formats and do NOT show this note.
//
// One source of truth so the PDF and the public web report stay identical.

export function buildScaleNote(noun: string): string {
  return `All ${noun} are scored from 0 to 50, positive or negative — a '+' sign marks positive readings, while negative readings (shown in red) should be corrected on priority to balance your Aura, ideally by raising each into the strong positive range of +40 to +50 for the best overall results.`;
}

// v2 note for Chakra / Planets / Elements / Life Challenges. Those reports no
// longer print raw scores — a positive reading shows as a percentage and
// anything at or below zero shows only as "Negative Energy Detected" — so the
// original note above would describe '+' signs and a 0-50 scale the customer
// can no longer see. The old wording stays in use for entries saved before the
// change, which still render their original bars and numbers.
// The +40..+50 "strong positive range" converts to 80%..100% on the new scale.
export function buildPolarityScaleNote(noun: string): string {
  return `All ${noun} are shown either as a positive percentage or as negative energy detected. Those showing negative energy should be corrected on priority to balance your Aura — ideally raised into the strong positive range of 80% to 100% for the best overall results.`;
}
