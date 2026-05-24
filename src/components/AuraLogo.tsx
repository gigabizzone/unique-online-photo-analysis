"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Loads /logo.png (the real Aura Photo Science logo). When that file isn't
// present (or fails to load), falls back to a gold-glow ॐ placeholder so the
// UI stays presentable. Kiran can drop public/logo.png into the repo at any
// point and it will appear automatically on the next render.

export function AuraLogo({
  size = 80,
  className,
  alt = "Aura Photo Science",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white shadow-lg select-none",
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background:
            "radial-gradient(circle, #E8B86A 0%, #D4A24C 60%, #8E44AD 100%)",
        }}
        aria-hidden
      >
        ॐ
      </div>
    );
  }

  // Plain <img> (not next/image) so onError can swap to the fallback without
  // wrestling Next.js's optimization pipeline. The real Aura Photo Science
  // logo is rectangular (silhouette + wordmark), so we constrain by HEIGHT
  // and let width auto-scale — no circular crop. The ॐ fallback above is
  // the only place that uses rounded-full.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/logo.png"
      alt={alt}
      height={size}
      onError={() => setErrored(true)}
      className={cn("object-contain", className)}
      style={{ height: size, width: "auto", maxWidth: size * 3 }}
    />
  );
}
