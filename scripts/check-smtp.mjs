// Read-only diagnostic: check whether the SMTP_* env vars needed for
// Phase 8 are populated. Never echoes the password value.

const v = (n) => (process.env[n] || "").length > 0;
const len = (n) => (process.env[n] || "").length;

console.log("SMTP_HOST:    ", v("SMTP_HOST") ? "✓ set" : "✗ blank");
console.log("SMTP_PORT:    ", v("SMTP_PORT") ? "✓ set" : "✗ blank");
console.log("SMTP_USER:    ", v("SMTP_USER") ? "✓ set" : "✗ blank");
console.log(
  "SMTP_PASS:    ",
  v("SMTP_PASS") ? `✓ set (length: ${len("SMTP_PASS")})` : "✗ BLANK — needed for Phase 8"
);
console.log("EMAIL_FROM:   ", v("EMAIL_FROM") ? "✓ set" : "✗ blank");
console.log(
  "ADMIN_EMAIL:  ",
  v("ADMIN_EMAIL") ? `✓ set (${process.env.ADMIN_EMAIL})` : "✗ blank"
);
