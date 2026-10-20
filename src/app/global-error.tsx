"use client";

import { ShieldAlert, RotateCcw } from "lucide-react";

/**
 * global-error.tsx renders outside the root layout so it must supply its own
 * <html> and <body>. Tailwind utility classes are inlined via a minimal style
 * block so the page is readable even when the stylesheet fails to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical error — SecuraAI</title>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:system-ui,sans-serif;background:#f6f8fc;color:#101b3f;display:flex;min-height:100dvh;align-items:center;justify-content:center;padding:1.5rem}
          .card{text-align:center;max-width:28rem;width:100%}
          .icon-wrap{background:#fff;border:1px solid #dfe6f2;border-radius:16px;width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin:0 auto 2rem;box-shadow:0 1px 3px rgba(0,0,0,.07)}
          .label{color:#dc3545;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.5rem}
          h1{font-size:1.375rem;font-weight:600;letter-spacing:-.01em;margin-bottom:.75rem}
          p{color:#60708f;font-size:.875rem;line-height:1.6;max-width:26rem;margin:0 auto 2rem}
          .digest{font-family:ui-monospace,monospace;font-size:.7rem;color:#60708f;background:#fff;border:1px solid #dfe6f2;border-radius:8px;padding:.375rem 1rem;display:inline-block;margin-bottom:1.5rem}
          .btn{display:inline-flex;align-items:center;gap:.5rem;background:#1769f6;color:#fff;border:none;border-radius:8px;padding:.5rem 1.25rem;font-size:.875rem;font-weight:500;cursor:pointer;min-height:40px;transition:background .15s}
          .btn:hover{background:#1358d4}
          .btn:focus-visible{outline:2px solid #1769f6;outline-offset:2px}
          .footer{border-top:1px solid #dfe6f2;margin-top:2.5rem;padding-top:1.5rem;color:#60708f;font-size:.7rem}
        `}</style>
      </head>
      <body>
        <div
          className="card"
          style={{ textAlign: "center", maxWidth: "28rem", width: "100%" }}
        >
          {/* Icon */}
          <div className="icon-wrap">
            <ShieldAlert
              aria-hidden="true"
              color="#dc3545"
              size={36}
              strokeWidth={1.5}
            />
          </div>

          {/* Label */}
          <p className="label">Critical error</p>

          {/* Title */}
          <h1>The application encountered a critical error</h1>

          {/* Description */}
          <p>
            SecuraAI could not recover from an unexpected failure. Reloading the
            page usually resolves the issue. If the problem persists, contact
            your system administrator.
          </p>

          {/* Digest */}
          {error.digest ? (
            <div className="digest">Error ID: {error.digest}</div>
          ) : null}

          {/* Reload */}
          <button type="button" className="btn" onClick={reset}>
            <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />
            Reload application
          </button>

          {/* Footer */}
          <div className="footer">
            SecuraAI &mdash; Enterprise Security Platform
          </div>
        </div>
      </body>
    </html>
  );
}
