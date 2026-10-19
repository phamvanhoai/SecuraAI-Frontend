import {
  Activity,
  BarChart3,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";

const FEATURES = [
  {
    icon: ShieldAlert,
    label: "AI-powered anomaly detection and real-time alerting",
  },
  {
    icon: BarChart3,
    label: "Risk register, assessment and treatment tracking",
  },
  {
    icon: Workflow,
    label: "Policy lifecycle, compliance controls and evidence",
  },
  {
    icon: Activity,
    label: "Incident response, audit trails and security reporting",
  },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background grid min-h-[100dvh] lg:grid-cols-[minmax(24rem,0.9fr)_minmax(32rem,1.1fr)]">
      {/* ── Left branding panel ── */}
      <section
        aria-hidden="true"
        className="border-border bg-sidebar relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between"
      >
        {/* Subtle dot-grid decoration */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Top accent line */}
        <div className="bg-brand absolute top-0 right-0 left-0 h-[3px]" />

        <div className="relative flex flex-col gap-10 p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="bg-brand/15 border-brand/20 grid size-11 place-items-center rounded-xl border text-white">
              <ShieldCheck
                className="text-brand size-6"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
            <span className="text-sidebar-foreground text-lg font-bold tracking-tight">
              SecuraAI
            </span>
          </div>

          {/* Hero copy */}
          <div className="max-w-sm">
            <div className="text-brand mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Activity
                className="size-3.5"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              Security operations workspace
            </div>
            <h1 className="text-sidebar-foreground text-3xl leading-[1.15] font-semibold tracking-[-0.03em] xl:text-4xl">
              Manage risk.{" "}
              <span className="text-brand">Protect operations.</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/50">
              A centralized GRC platform combining AI anomaly detection,
              incident response, risk management and compliance operations.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="bg-brand/10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg">
                  <Icon
                    className="text-brand size-4"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm leading-6 text-white/60">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-border/20 relative border-t p-10 xl:px-14 xl:pb-12">
          <div className="flex items-center gap-2.5 text-xs text-white/40">
            <LockKeyhole
              className="size-3.5 shrink-0"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            Session credentials are protected in an HttpOnly cookie.
          </div>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="bg-surface flex min-w-0 flex-col">
        {/* Mobile header */}
        <div className="border-border flex h-16 items-center border-b px-5 lg:hidden">
          <ShieldCheck
            aria-hidden="true"
            className="text-brand mr-2 size-5"
            strokeWidth={1.8}
          />
          <span className="font-semibold tracking-tight">SecuraAI</span>
        </div>
        <div className="grid flex-1 place-items-center px-5 py-10 sm:px-10">
          {children}
        </div>
      </section>
    </main>
  );
}
