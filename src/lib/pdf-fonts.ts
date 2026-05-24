// Register custom fonts with @react-pdf/renderer.
//
// Why this exists: Helvetica (the built-in @react-pdf default) has no
// Devanagari glyphs, so the Hindi slogan renders as garbage box-art
// characters. We register Noto Sans Devanagari (open source, via the
// @fontsource/noto-sans-devanagari npm package) and have the Hindi
// Text elements explicitly set fontFamily: "NotoSansDevanagari".
//
// Latin text continues to use Helvetica — no change needed.
//
// Idempotent: safe to call multiple times; @react-pdf's Font.register is
// keyed by family name, so we just gate it behind a module-scope flag.

import { Font } from "@react-pdf/renderer";
import path from "node:path";

let registered = false;

function fontsourcePath(filename: string): string {
  return path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans-devanagari",
    "files",
    filename
  );
}

export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: "NotoSansDevanagari",
    fonts: [
      {
        src: fontsourcePath("noto-sans-devanagari-devanagari-400-normal.woff"),
        fontWeight: 400,
      },
      {
        src: fontsourcePath("noto-sans-devanagari-devanagari-700-normal.woff"),
        fontWeight: 700,
      },
    ],
  });
  registered = true;
}
