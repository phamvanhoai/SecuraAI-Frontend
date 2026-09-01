import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { safeReturnUrl } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const returnUrl = safeReturnUrl(typeof params.returnUrl === "string" ? params.returnUrl : undefined);
  return (
    <section className="w-full max-w-[26rem]" aria-labelledby="login-title">
      <div className="mb-9">
        <p className="mb-3 text-sm font-semibold text-brand">Cổng quản trị doanh nghiệp</p>
        <h2 id="login-title" className="text-4xl font-semibold tracking-[-0.035em]">
          Đăng nhập
        </h2>
        <p className="mt-3 max-w-sm leading-6 text-muted">
          Nhập thông tin tài khoản được tổ chức của bạn cấp.
        </p>
      </div>
      <LoginForm returnUrl={returnUrl} />
      <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted">
        Không chia sẻ mật khẩu hoặc mã xác thực với bất kỳ ai.
      </p>
    </section>
  );
}
