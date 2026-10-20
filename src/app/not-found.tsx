"use client";

import Link from "next/link";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="bg-background flex min-h-[100dvh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon badge */}
        <div className="bg-surface border-border mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border shadow-sm">
          <ShieldOff
            aria-hidden="true"
            className="text-muted size-9"
            strokeWidth={1.5}
          />
        </div>

        {/* Error code */}
        <p className="text-brand mb-2 text-sm font-bold tracking-widest uppercase">
          404
        </p>

        {/* Title */}
        <h1 className="text-foreground mb-3 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
          The page you requested does not exist or you do not have permission to
          access it. Check the URL or return to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="bg-brand text-brand-contrast hover:bg-brand/90 focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Home aria-hidden="true" className="size-4" strokeWidth={2} />
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="border-border bg-surface text-foreground hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            Go back
          </button>
        </div>

        {/* Footer */}
        <div className="border-border mx-auto mt-10 max-w-[240px] border-t pt-6">
          <p className="text-muted text-xs">
            SecuraAI &mdash; Enterprise Security Platform
          </p>
        </div>
      </div>
    </main>
  );
}
