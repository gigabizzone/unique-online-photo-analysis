// PRD §7.4 — QR encodes {APP_URL}/report/{publicId} and is embedded into
// the PDF on the last page. Output is a PNG data URL so @react-pdf can
// drop it directly into an <Image src=...> without filesystem hops.

import QRCode from "qrcode";

export interface QrOptions {
  /** Size in pixels (square). Default 240. */
  size?: number;
  /** Error-correction level. Default "M" (~15% damage tolerance). */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export async function generateQrDataUrl(
  url: string,
  opts: QrOptions = {}
): Promise<string> {
  return QRCode.toDataURL(url, {
    width: opts.size ?? 240,
    margin: 1,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? "M",
    color: {
      dark: "#1F1B2E", // PRD §3.4 text-on-light colour
      light: "#FFFFFF",
    },
  });
}
