import { Activity, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background grid min-h-[100dvh] lg:grid-cols-[minmax(24rem,0.9fr)_minmax(32rem,1.1fr)]">
      <section className="border-border bg-neutral-soft/60 text-foreground relative hidden overflow-hidden border-r p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="bg-brand grid size-11 place-items-center rounded-lg text-white">
            <ShieldCheck
              aria-hidden="true"
              className="size-7"
              strokeWidth={1.8}
            />
          </span>
          SecuraAI
        </div>
        <div className="max-w-md">
          <div className="text-brand mb-5 flex items-center gap-2 text-sm font-semibold">
            <Activity aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Security operations workspace
          </div>
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-[-0.03em] xl:text-5xl">
            Manage risk. Protect operations.
          </h1>
          <p className="text-muted mt-6 text-base leading-7">
            A centralized workspace for security events, assets, risks,
            incidents, and compliance operations.
          </p>
        </div>
        <div className="border-border text-muted flex items-center gap-3 border-t pt-6 text-sm">
          <LockKeyhole
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.8}
          />
          Session credentials are protected in an HttpOnly cookie.
        </div>
      </section>
      <section className="bg-surface flex min-w-0 flex-col">
        <div className="border-border flex h-18 items-center border-b px-5 lg:hidden">
          <ShieldCheck
            aria-hidden="true"
            className="text-brand mr-2 size-6"
            strokeWidth={1.8}
          />
          <span className="font-semibold">SecuraAI</span>
        </div>
        <div className="grid flex-1 place-items-center px-5 py-10 sm:px-10">
          {children}
        </div>
      </section>
    </main>
  );
}
