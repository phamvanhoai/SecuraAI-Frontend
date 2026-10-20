"use client";

import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-background flex min-h-[100dvh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon badge */}
        <div className="bg-surface border-border mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border shadow-sm">
          <AlertTriangle
            aria-hidden="true"
            className="text-warning size-9"
            strokeWidth={1.5}
          />
        </div>

        {/* Error code */}
        <p className="text-warning mb-2 text-sm font-bold tracking-widest uppercase">
          Something went wrong
        </p>

        {/* Title */}
        <h1 className="text-foreground mb-3 text-2xl font-semibold tracking-tight">
          An error occurred
        </h1>

        {/* Description */}
        <p className="text-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
          Unable to complete the request. This may be a temporary issue. Try
          again or return to the dashboard.
        </p>

        {/* Digest — only shown when present, helps support triage */}
        {error.digest ? (
          <p className="border-border bg-surface text-muted mx-auto mb-6 max-w-xs rounded-lg border px-4 py-2 font-mono text-xs">
            Error ID: {error.digest}
          </p>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="bg-brand text-brand-contrast hover:bg-brand/90 focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <RotateCcw aria-hidden="true" className="size-4" strokeWidth={2} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="border-border bg-surface text-foreground hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Home aria-hidden="true" className="size-4" strokeWidth={2} />
            Go to dashboard
          </Link>
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
