"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../api/login";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import {
  canAccessPanel,
  defaultPanelPath,
  panelFromPath,
} from "@/config/navigation";

export function LoginForm({
  returnUrl = "/dashboard",
  passwordChanged = false,
}: {
  returnUrl?: string;
  passwordChanged?: boolean;
}) {
  const router = useRouter();
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
      if (!response.ok)
        throw new Error("Unable to verify your session. Please try again.");
      const payload = (await response.json().catch(() => undefined)) as
        | {
            data?: {
              user?: {
                roles?: Array<{ code: string }>;
                mustChangePassword?: boolean;
              };
            };
          }
        | undefined;
      if (payload?.data?.user?.mustChangePassword === true) {
        router.replace("/change-password?required=1");
        return;
      }
      const roles = payload?.data?.user?.roles ?? [];
      const roleCodes = roles.map((role) => role.code);
      const defaultPanel = defaultPanelPath(roleCodes);
      const requestedPanel = panelFromPath(returnUrl);
      const destination =
        returnUrl === "/dashboard" ||
        (requestedPanel !== null && !canAccessPanel(roleCodes, requestedPanel))
          ? defaultPanel
          : returnUrl;
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
      {passwordChanged ? (
        <Alert className="border-success/25 bg-success-soft text-success">
          Password changed successfully. Sign in again with your new password.
        </Alert>
      ) : null}
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
