"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../api/password-reset";
import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
  type ConfirmPasswordResetInput,
  type RequestPasswordResetInput,
} from "../schemas/password-reset-schema";

type Step = "email" | "otp" | "password" | "success";

export function RecoveryCard({ step }: { step: Step }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [otp, setOtp] = useState(tokenFromUrl.padEnd(6, " ").slice(0, 6).split(""));
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const content = {
    email: ["Forgot password", "Enter your email address to receive a password reset code."],
    otp: ["Verify OTP", "Enter the 6-digit verification code sent to your email."],
    password: ["Reset password", "Create a new password to finish the process."],
    success: ["Password reset complete", "Your password has been updated successfully."],
  } as const;
  const Icon = step === "success" ? Check : step === "email" ? Mail : step === "otp" ? ShieldCheck : KeyRound;

  async function submitEmail(values: RequestPasswordResetInput): Promise<void> {
    setMessage(undefined);
    setPending(true);
    try {
      await requestPasswordReset(values);
      router.push(`/otp?email=${encodeURIComponent(values.email)}`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to request a password reset.");
    } finally {
      setPending(false);
    }
  }

  function submitOtp(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const code = otp.join("").trim();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }
    router.push(`/reset-password?token=${code}`);
  }

  async function submitPassword(values: ConfirmPasswordResetInput): Promise<void> {
    setMessage(undefined);
    setPending(true);
    try {
      await confirmPasswordReset(values);
      router.push("/reset-password-success");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to reset the password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-full max-w-[46rem]">
      <Link href={step === "email" ? "/login" : "/forgot-password"} className="text-brand mb-5 inline-flex text-sm font-medium">Back</Link>
      <div className="border-border bg-surface rounded-[12px] border p-7 shadow-[0_20px_55px_rgba(28,55,100,0.08)] sm:p-10">
        <div className="text-center">
          <span className="bg-brand-soft text-brand mx-auto grid size-16 place-items-center rounded-full"><Icon className="size-8" /></span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">{content[step][0]}</h1>
          <p className="text-muted mx-auto mt-2 max-w-lg text-sm leading-6">{content[step][1]}</p>
        </div>
        {message ? <Alert className="border-danger/25 bg-danger-soft text-danger mt-6">{message}</Alert> : null}
        {step === "email" ? <EmailForm pending={pending} onSubmit={submitEmail} /> : null}
        {step === "otp" ? <OtpForm otp={otp} setOtp={setOtp} onSubmit={submitOtp} /> : null}
        {step === "password" ? <PasswordForm token={tokenFromUrl} pending={pending} onSubmit={submitPassword} /> : null}
        {step === "success" ? <div className="mx-auto mt-8 max-w-xl"><div className="bg-success-soft text-success rounded-lg p-4 text-center text-sm">Your account is now secure.</div><Link href="/login" className="bg-brand mt-6 grid min-h-12 place-items-center rounded-lg font-semibold text-white">Sign in</Link></div> : null}
      </div>
    </section>
  );
}

function EmailForm({ pending, onSubmit }: { pending: boolean; onSubmit: (values: RequestPasswordResetInput) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(requestPasswordResetSchema) });
  return <form className="mx-auto mt-8 max-w-xl space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}><label className="block text-sm font-medium">Email<Input className="mt-2" type="email" autoComplete="email" {...register("email")} />{errors.email ? <span className="text-danger mt-1 block text-sm">{errors.email.message}</span> : null}</label><Button className="mt-2 w-full" disabled={pending} type="submit">{pending ? "Sending..." : "Send reset code"}</Button></form>;
}

function OtpForm({ otp, setOtp, onSubmit }: { otp: string[]; setOtp: (value: string[]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string): void {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.map((item, itemIndex) => itemIndex === index ? digit : item);
    setOtp(next);
    if (digit && index < next.length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  return <form className="mx-auto mt-8 max-w-xl" onSubmit={onSubmit}><div className="grid grid-cols-6 gap-3">{otp.map((value, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} aria-label={`OTP digit ${index + 1}`} className="border-border focus:border-brand focus:ring-brand/15 h-14 min-w-0 rounded-lg border px-1 text-center text-xl outline-none focus:ring-3" inputMode="numeric" maxLength={1} value={value.trim()} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)} />)}</div><Button className="mt-6 w-full" type="submit">Verify and continue</Button></form>;
}

function PasswordForm({ token, pending, onSubmit }: { token: string; pending: boolean; onSubmit: (values: ConfirmPasswordResetInput) => Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ConfirmPasswordResetInput>({ resolver: zodResolver(confirmPasswordResetSchema), defaultValues: { token, newPassword: "", confirmPassword: "" } });
  return <form className="mx-auto mt-8 max-w-xl space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}><input type="hidden" {...register("token")} /><label className="block text-sm font-medium">New password<div className="relative mt-2"><Input className="pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("newPassword")} /><button aria-label={showPassword ? "Hide new password" : "Show new password"} className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div>{errors.newPassword ? <span className="text-danger mt-1 block text-sm">{errors.newPassword.message}</span> : null}</label><label className="block text-sm font-medium">Confirm new password<div className="relative mt-2"><Input className="pr-12" type={showConfirmation ? "text" : "password"} autoComplete="new-password" {...register("confirmPassword")} /><button aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"} className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2" type="button" onClick={() => setShowConfirmation((value) => !value)}>{showConfirmation ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div>{errors.confirmPassword ? <span className="text-danger mt-1 block text-sm">{errors.confirmPassword.message}</span> : null}</label><Button className="mt-2 w-full" disabled={pending} type="submit">{pending ? "Resetting..." : "Reset password"}</Button></form>;
}
