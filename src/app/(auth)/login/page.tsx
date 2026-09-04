import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { safeReturnUrl } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
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
          Đăng nhập
        </h2>
        <p className="text-muted mx-auto mt-3 max-w-sm text-sm leading-6">
          Nhập thông tin tài khoản được tổ chức của bạn cấp.
        </p>
      </div>
      <LoginForm returnUrl={returnUrl} />
      <p className="border-border text-muted mt-8 border-t pt-5 text-xs leading-5">
        Không chia sẻ mật khẩu hoặc mã xác thực với bất kỳ ai.
      </p>
    </section>
  );
}
