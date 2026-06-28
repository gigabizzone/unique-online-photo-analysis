"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If NextAuth bounced us here with ?error=... show it (URL-encoded message
  // from the authorize() throw).
  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam) setError(decodeURIComponent(errParam));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <main className="aps-gradient-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo block (PRD §3.1) — placeholder until Phase 4 drops the real logo */}
        <div className="text-center mb-8">
          <div
            className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{
              background:
                "radial-gradient(circle, #E8B86A 0%, #D4A24C 60%, #8E44AD 100%)",
            }}
            aria-hidden
          >
            ॐ
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Aura Photo Science
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-medium text-white mb-1">Welcome back</h2>
          <p className="text-sm text-white/60 mb-6">
            Sign in to your admin account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-md bg-white/10 border border-white/20 px-3 py-2",
                  "text-white placeholder:text-white/40",
                  "focus:outline-none focus:ring-2 focus:ring-aps-gold/60 focus:border-aps-gold/60",
                  "disabled:opacity-50"
                )}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-md bg-white/10 border border-white/20 px-3 py-2",
                  "text-white placeholder:text-white/40",
                  "focus:outline-none focus:ring-2 focus:ring-aps-gold/60 focus:border-aps-gold/60",
                  "disabled:opacity-50"
                )}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          AT AURA PHOTO SCIENCE – WE TRANSFORM YOUR LIFE.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="aps-gradient-bg min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
