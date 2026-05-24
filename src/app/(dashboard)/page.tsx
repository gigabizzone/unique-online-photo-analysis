// Placeholder dashboard home. Phase 4 will replace this with the
// full welcome screen per PRD §5.2 (logo, slogans, 6 tiles, etc).

export default function DashboardHome() {
  return (
    <main className="flex flex-col items-center justify-center text-center px-6 py-20">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
        Unique Online Photo Analysis
      </h1>
      <p className="mt-3 text-lg md:text-xl text-aps-gold">
        Aura Photo Science
      </p>
      <p className="mt-10 text-sm text-white/70 max-w-md">
        You&apos;re signed in. The full welcome dashboard (logo, slogans, six
        analysis tiles) arrives in Phase 4.
      </p>
    </main>
  );
}
