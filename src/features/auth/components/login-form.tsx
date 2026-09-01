"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../api/login";
import { loginSchema, type LoginInput } from "../schemas/login-schema";

export function LoginForm({ returnUrl = "/dashboard" }: { returnUrl?: string }) {
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setMessage(undefined);
    try {
      await login(values);
      window.location.assign(returnUrl);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng nhập. Vui lòng thử lại.");
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      {message ? <Alert>{message}</Alert> : null}
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <FormField id="password" label="Mật khẩu" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </FormField>
      <div className="flex justify-end">
        <Link className="text-sm font-medium text-brand underline-offset-4 hover:underline" href="/forgot-password">
          Quên mật khẩu?
        </Link>
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
