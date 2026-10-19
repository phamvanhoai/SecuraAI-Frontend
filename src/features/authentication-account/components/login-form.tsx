"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../api/login";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import { env } from "@/lib/env";
import {
  canAccessPanel,
  defaultPanelPath,
  panelFromPath,
} from "@/config/navigation";

type GoogleCredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: Record<string, string | number>,
          ): void;
        };
      };
    };
  }
}

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
  const [googleReady, setGoogleReady] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const googleButton = useRef<HTMLDivElement>(null);
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
      await finishLogin();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  }

  const finishLogin = useCallback(async (): Promise<void> => {
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
  }, [returnUrl, router]);

  useEffect(() => {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const parent = googleButton.current;
    if (!googleReady || !clientId || !parent || !window.google) return;
    parent.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) return;
        setMessage(undefined);
        setGooglePending(true);
        void fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        })
          .then(async (result) => {
            if (!result.ok) throw new Error("Unable to sign in with Google.");
            await finishLogin();
          })
          .catch((error: unknown) => {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to sign in with Google.",
            );
          })
          .finally(() => setGooglePending(false));
      },
    });
    window.google.accounts.id.renderButton(parent, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(400, Math.floor(parent.clientWidth)),
    });
  }, [finishLogin, googleReady]);

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      {passwordChanged ? (
        <Alert className="border-success/25 bg-success-soft text-success">
          Password changed successfully. Sign in again with your new password.
        </Alert>
      ) : null}
      {message ? <Alert>{message}</Alert> : null}

      {/* Email field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            strokeWidth={1.8}
          />
          <Input
            id="email"
            className="pl-10"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p id="email-error" className="text-danger text-sm">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Link
            className="text-brand text-xs font-medium underline-offset-4 hover:underline"
            href="/forgot-password"
            tabIndex={0}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock
            aria-hidden="true"
            className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            strokeWidth={1.8}
          />
          <Input
            id="password"
            className="px-10"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-muted hover:text-foreground focus-visible:outline-brand absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-danger text-sm">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {/* CTA */}
      <Button
        className="mt-2 w-full"
        disabled={isSubmitting || googlePending}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </>
        )}
      </Button>

      {env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={() => setGoogleReady(true)}
          />
          <div
            role="separator"
            aria-hidden="true"
            className="flex items-center gap-3"
          >
            <div className="border-border h-px flex-1 border-t" />
            <span className="text-muted text-xs">Or continue with</span>
            <div className="border-border h-px flex-1 border-t" />
          </div>
          <div
            ref={googleButton}
            className="min-h-11 w-full overflow-hidden [&>div]:mx-auto"
            aria-busy={googlePending}
          />
        </>
      ) : null}
    </form>
  );
}
