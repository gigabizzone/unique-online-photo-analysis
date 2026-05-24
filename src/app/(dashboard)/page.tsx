// Welcome dashboard — PRD §5.2.
// Hero with logo + slogans + tagline + current date, six analysis tiles,
// quick links strip, social footer. Auth is guaranteed by the parent
// (dashboard)/layout.tsx + middleware.

import Link from "next/link";
import {
  Flower2,
  Orbit,
  Sparkles,
  Mountain,
  Aperture,
  Gem,
  History,
  Users,
  Settings as SettingsIcon,
  ArrowRight,
} from "lucide-react";

import { BRAND, ANALYSIS_TYPES } from "@/constants/branding";
import { AuraLogo } from "@/components/AuraLogo";
import { SocialFooter } from "@/components/SocialFooter";
import { cn } from "@/lib/utils";

// Map iconName from constants to the actual lucide-react component.
const TILE_ICONS = {
  flower2: Flower2,
  orbit: Orbit,
  sparkles: Sparkles,
  mountain: Mountain,
  aperture: Aperture,
  gem: Gem,
} as const;

function formatDate(d: Date): string {
  // "Sunday, 24 May 2026"
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardHome() {
  const today = formatDate(new Date());

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {/* HERO */}
        <section className="text-center">
          <div className="flex justify-center">
            <AuraLogo size={240} className="shadow-2xl" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
            {BRAND.appName}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/80 italic">
            {BRAND.sloganEn}
          </p>
          <p className="mt-1 text-sm sm:text-base text-white/60">
            {BRAND.sloganHi}
          </p>
          <p className="mt-5 text-base sm:text-lg font-semibold tracking-wide text-aps-gold uppercase">
            {BRAND.tagline}
          </p>
          <p className="mt-3 text-xs sm:text-sm text-white/50">{today}</p>
        </section>

        {/* ACTION GRID — 6 tiles, 3×2 desktop, 1 col mobile */}
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {ANALYSIS_TYPES.map((t) => {
            const Icon = TILE_ICONS[t.iconName as keyof typeof TILE_ICONS];
            return (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className={cn(
                  "group relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6",
                  "transition-all duration-200",
                  "hover:bg-white/10 hover:border-aps-gold/40 hover:-translate-y-0.5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-aps-gold/60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center text-white shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(212,162,76,0.30) 0%, rgba(142,68,173,0.30) 100%)",
                    }}
                  >
                    {Icon && <Icon className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-medium text-white">
                      {t.label}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">
                      {t.blurb}
                    </p>
                  </div>
                  <ArrowRight
                    className="shrink-0 h-4 w-4 text-white/30 group-hover:text-aps-gold transition-colors"
                    aria-hidden
                  />
                </div>
              </Link>
            );
          })}
        </section>

        {/* QUICK LINKS STRIP */}
        <section className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-aps-gold transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          <span className="text-white/20" aria-hidden>
            |
          </span>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-aps-gold transition-colors"
          >
            <Users className="h-4 w-4" />
            Customers
          </Link>
          <span className="text-white/20" aria-hidden>
            |
          </span>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-aps-gold transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </section>
      </main>

      <SocialFooter />
    </>
  );
}
