import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
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
  );
  return (
    <section
      className="border-border bg-surface w-full max-w-[30rem] rounded-[12px] border p-7 shadow-[0_20px_55px_rgba(28,55,100,0.08)] sm:p-10"
      aria-labelledby="login-title"
    >
      <div className="mb-8 text-center">
        <h2
          id="login-title"
          className="text-3xl font-semibold tracking-[-0.035em]"
        >
          Sign in
        </h2>
        <p className="text-muted mx-auto mt-3 max-w-sm text-sm leading-6">
          Enter the account information provided by your organization.
        </p>
      </div>
      <LoginForm returnUrl={returnUrl} />
    </section>
  );
}
