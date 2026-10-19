import type { Metadata } from "next";
import { LoginForm } from "@/features/authentication-account";
import { safeReturnUrl } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnUrl = safeReturnUrl(
    typeof params.returnUrl === "string" ? params.returnUrl : undefined,
    "/dashboard",
  );
  const passwordChanged = params.passwordChanged === "1";
  return (
    <section
      className="border-border bg-surface w-full max-w-[30rem] rounded-xl border p-6 sm:p-8"
      aria-labelledby="login-title"
    >
      <div className="border-border mb-6 border-b pb-6 text-center">
        <h2
          id="login-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          Sign in
        </h2>
        <p className="text-muted mx-auto mt-3 max-w-sm text-sm leading-6">
          Enter the account information provided by your organization.
        </p>
      </div>
      <LoginForm returnUrl={returnUrl} passwordChanged={passwordChanged} />
    </section>
  );
}
