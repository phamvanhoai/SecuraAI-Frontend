import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/authentication-account";
import { safeReturnUrl } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const startFromOverview = params.passwordChanged === "1" || params.sessionExpired === "1";
  const returnUrl = safeReturnUrl(
    !startFromOverview && typeof params.returnUrl === "string" ? params.returnUrl : undefined,
    "/dashboard",
  );
  const passwordChanged = params.passwordChanged === "1";
  return (
    <section
      className="border-border bg-surface w-full max-w-[30rem] overflow-hidden rounded-xl border"
      aria-labelledby="login-title"
    >
      {/* Top accent bar */}
      <div className="bg-brand h-1 w-full" aria-hidden="true" />

      <div className="p-6 sm:p-8">
        {/* Icon + heading block */}
        <div className="mb-7 text-center">
          <div className="bg-brand/8 border-brand/12 mx-auto mb-4 grid size-14 place-items-center rounded-2xl border">
            <ShieldCheck
              className="text-brand size-7"
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </div>
          <h2
            id="login-title"
            className="text-[1.375rem] font-semibold tracking-[-0.03em]"
          >
            Welcome back
          </h2>
          <p className="text-muted mx-auto mt-1.5 max-w-[17rem] text-sm leading-6">
            Sign in to your SecuraAI workspace
          </p>
        </div>

        <LoginForm returnUrl={returnUrl} passwordChanged={passwordChanged} />

        {/* Trust indicators */}
        <div className="border-border mt-6 flex items-center justify-center gap-1.5 border-t pt-5">
          <Lock
            className="text-muted size-3 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="text-muted text-xs">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </section>
  );
}
