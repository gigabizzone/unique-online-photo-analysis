// Register custom fonts with @react-pdf/renderer.
//
// Why this exists: Helvetica (the built-in @react-pdf default) has no
// Devanagari glyphs, so the Hindi slogan renders as garbage box-art
// characters. We register Noto Sans Devanagari (open source) and have the
// Hindi Text elements explicitly set fontFamily: "NotoSansDevanagari".
//
// Why we ship the .woff files in public/fonts/ instead of pulling from
// node_modules/@fontsource: on Hostinger Node.js deploys the @fontsource
// package's `files/` directory was missing at runtime (PDF generation
// failed with ENOENT for the .woff path). Shipping the two weights we
// actually use as repo-tracked assets inside public/ is more reliable —
// Next.js always preserves public/ on deploy.
//
// Latin text continues to use Helvetica — no change needed.
//
// Idempotent: safe to call multiple times; @react-pdf's Font.register is
// keyed by family name, so we just gate it behind a module-scope flag.

import { Font } from "@react-pdf/renderer";
import path from "node:path";

let registered = false;

function publicFontPath(filename: string): string {
  return path.join(process.cwd(), "public", "fonts", filename);
}

export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: "NotoSansDevanagari",
    fonts: [
      {
        src: publicFontPath("noto-sans-devanagari-devanagari-400-normal.woff"),
        fontWeight: 400,
      },
      {
        src: publicFontPath("noto-sans-devanagari-devanagari-700-normal.woff"),
        fontWeight: 700,
      },
    ],
  });
  registered = true;
}
