"use client";
import { Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
type Step = "email" | "otp" | "password" | "success";
export function RecoveryCard({ step }: { step: Step }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const content = {
    email: [
      "Quên mật khẩu",
      "Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.",
    ],
    otp: [
      "Xác thực OTP",
      "Nhập mã xác thực gồm 6 số đã được gửi đến email của bạn.",
    ],
    password: ["Đặt lại mật khẩu", "Tạo mật khẩu mới để hoàn tất quá trình."],
    success: [
      "Đặt lại mật khẩu thành công!",
      "Mật khẩu của bạn đã được cập nhật thành công.",
    ],
  } as const;
  const Icon =
    step === "success"
      ? Check
      : step === "email"
        ? Mail
        : step === "otp"
          ? ShieldCheck
          : KeyRound;
  return (
    <section className="w-full max-w-[46rem]">
      <Link
        href={step === "email" ? "/login" : "/forgot-password"}
        className="text-brand mb-5 inline-flex text-sm font-medium"
      >
        ← Quay lại
      </Link>
      <div className="border-border bg-surface rounded-[12px] border p-7 shadow-[0_20px_55px_rgba(28,55,100,0.08)] sm:p-10">
        <div className="text-center">
          <span
            className={`mx-auto grid size-16 place-items-center rounded-full ${step === "success" ? "bg-success-soft text-success" : "bg-brand-soft text-brand"}`}
          >
            <Icon className="size-8" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
            {content[step][0]}
          </h1>
          <p className="text-muted mx-auto mt-2 max-w-lg text-sm leading-6">
            {content[step][1]}
          </p>
        </div>
        {step !== "success" ? (
          <div className="mx-auto mt-8 max-w-xl">
            <div className="text-muted mb-8 flex items-center justify-center gap-3 text-xs">
              <span className="bg-brand grid size-8 place-items-center rounded-full text-white">
                {step === "email" ? "1" : "✓"}
              </span>
              <span className="bg-border h-px w-20" />
              <span
                className={`grid size-8 place-items-center rounded-full ${step === "otp" ? "bg-brand text-white" : "border-border border"}`}
              >
                {step === "password" ? "✓" : "2"}
              </span>
              <span className="bg-border h-px w-20" />
              <span
                className={`grid size-8 place-items-center rounded-full ${step === "password" ? "bg-brand text-white" : "border-border border"}`}
              >
                3
              </span>
            </div>
            {step === "email" ? (
              <>
                <label className="text-sm font-medium">
                  Email hoặc tên đăng nhập
                  <input
                    className="border-border focus:border-brand focus:ring-brand/15 mt-2 min-h-12 w-full rounded-lg border px-4 outline-none focus:ring-3"
                    placeholder="Nhập email hoặc tên đăng nhập"
                  />
                </label>
                <Link
                  href="/otp"
                  className="bg-brand mt-6 grid min-h-12 place-items-center rounded-lg font-semibold text-white"
                >
                  Gửi hướng dẫn đặt lại mật khẩu
                </Link>
              </>
            ) : null}
            {step === "otp" ? (
              <>
                <div className="grid grid-cols-6 gap-3">
                  {otp.map((value, index) => (
                    <input
                      aria-label={`Số OTP ${index + 1}`}
                      className="border-border focus:border-brand focus:ring-brand/15 h-14 min-w-0 rounded-lg border text-center text-xl outline-none focus:ring-3"
                      inputMode="numeric"
                      key={index}
                      maxLength={1}
                      value={value}
                      onChange={(event) =>
                        setOtp((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? event.target.value.replace(/\D/g, "")
                              : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                <Link
                  href="/reset-password"
                  className="bg-brand mt-6 grid min-h-12 place-items-center rounded-lg font-semibold text-white"
                >
                  Xác thực và tiếp tục
                </Link>
              </>
            ) : null}
            {step === "password" ? (
              <>
                <label className="block text-sm font-medium">
                  Mật khẩu mới
                  <input
                    className="border-border mt-2 min-h-12 w-full rounded-lg border px-4"
                    type="password"
                  />
                </label>
                <label className="mt-5 block text-sm font-medium">
                  Xác nhận mật khẩu mới
                  <input
                    className="border-border mt-2 min-h-12 w-full rounded-lg border px-4"
                    type="password"
                  />
                </label>
                <Link
                  href="/reset-password-success"
                  className="bg-brand mt-6 grid min-h-12 place-items-center rounded-lg font-semibold text-white"
                >
                  Đặt lại mật khẩu
                </Link>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-xl">
            <div className="bg-success-soft text-success rounded-lg p-4 text-center text-sm">
              Tài khoản của bạn hiện đã được bảo mật.
            </div>
            <Link
              href="/login"
              className="bg-brand mt-6 grid min-h-12 place-items-center rounded-lg font-semibold text-white"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
