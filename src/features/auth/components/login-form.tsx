"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../api/login";
import { loginSchema, type LoginInput } from "../schemas/login-schema";

export function LoginForm({ returnUrl = "/admin" }: { returnUrl?: string }) {
  const [message, setMessage] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await response.json().catch(() => undefined)) as
        | { data?: { user?: { roles?: Array<{ code: string }> } } }
        | undefined;
      const roles = payload?.data?.user?.roles ?? [];
      const defaultPanel = roles.some((role) => role.code === "ADMIN")
        ? "/admin"
        : roles.some((role) => role.code === "SECURITY_OFFICER")
          ? "/security-officer"
          : roles.some((role) => role.code === "EXECUTIVE_AUDITOR")
            ? "/executive-auditor"
            : "/employee";
      const destination = returnUrl === "/admin" ? defaultPanel : returnUrl;
      window.location.assign(destination);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
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
      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="password"
            className="pr-12"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-muted hover:text-foreground focus-visible:outline-brand absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>
      <div className="flex justify-end">
        <Link
          className="text-brand text-sm font-medium underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
