"use client";

import {
  BadgeCheck,
  ChevronRight,
  History,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";

export default function ProfilePage() {
  const session = useSessionUser();

  if (session.isPending) return <ProfileLoadingState />;

  const user = session.data;
  if (!user) {
    return (
      <>
        <ProductPageHeader
          title="My profile"
          description="Review your account identity, access roles, and security settings."
          showSampleNotice={false}
        />
        <ProductPanel
          title="Profile unavailable"
          description="Your account information could not be retrieved."
        >
          <div className="p-4">
            <Alert>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Your session may have expired. Sign in again or retry the
                  request.
                </span>
                <Button
                  className="shrink-0"
                  onClick={() => void session.refetch()}
                  variant="secondary"
                >
                  Try again
                </Button>
              </div>
            </Alert>
          </div>
        </ProductPanel>
      </>
    );
  }

  const initials = getInitials(user.fullName);
  const active = user.status.toUpperCase() === "ACTIVE";

  return (
    <>
      <ProductPageHeader
        title="My profile"
        description="Review your account identity, access roles, and security settings."
        showSampleNotice={false}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <ProductPanel
          title="Profile information"
          description="Account information provided by SecuraAI identity services."
        >
          <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden="true"
                className="bg-brand-soft text-brand grid size-14 shrink-0 place-items-center rounded-xl text-lg font-semibold"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold break-words">
                  {user.fullName}
                </h2>
                <p className="text-muted mt-1 flex min-w-0 items-center gap-2 text-sm">
                  <Mail
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span className="truncate" title={user.email}>
                    {user.email}
                  </span>
                </p>
              </div>
            </div>
            <StatusBadge tone={active ? "success" : "neutral"}>
              {formatLabel(user.status)}
            </StatusBadge>
          </div>

          <dl className="grid sm:grid-cols-2">
            <ProfileDetail
              icon={<UserRound />}
              label="Full name"
              value={user.fullName}
            />
            <ProfileDetail
              icon={<Mail />}
              label="Email address"
              value={user.email}
            />
            <ProfileDetail
              icon={<ShieldCheck />}
              label="Assigned roles"
              value={
                user.roles.length ? (
                  <span className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <StatusBadge key={role.code} tone="info">
                        {role.name}
                      </StatusBadge>
                    ))}
                  </span>
                ) : (
                  "No role assigned"
                )
              }
            />
            <ProfileDetail
              icon={<BadgeCheck />}
              label="Account status"
              value={formatLabel(user.status)}
            />
          </dl>
        </ProductPanel>

        <ProductPanel
          title="Account security"
          description="Manage your credentials and review authentication activity."
        >
          <nav
            aria-label="Account security options"
            className="divide-border divide-y"
          >
            <SecurityLink
              description="Update the password used to access your account."
              href="/change-password"
              icon={<KeyRound />}
              title="Change password"
            />
            <SecurityLink
              description="Review successful and failed sign-in activity."
              href="/login-history"
              icon={<History />}
              title="Login history"
            />
          </nav>
        </ProductPanel>
      </div>
    </>
  );
}

function ProfileDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="border-border min-w-0 border-b p-5 sm:odd:border-r">
      <dt className="text-muted flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true" className="[&>svg]:size-4">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-2 min-w-0 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function SecurityLink({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-20 items-center gap-3 px-5 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      href={href}
    >
      <span
        aria-hidden="true"
        className="bg-neutral-soft text-muted grid size-10 shrink-0 place-items-center rounded-lg [&>svg]:size-4"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted mt-1 block text-xs leading-5">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="text-muted size-4 shrink-0"
        strokeWidth={1.8}
      />
    </Link>
  );
}

function ProfileLoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading profile" role="status">
      <div className="mb-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Skeleton className="h-96 rounded-[10px]" />
        <Skeleton className="h-64 rounded-[10px]" />
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase("en");
}

function formatLabel(value: string) {
  return value
    .toLocaleLowerCase("en")
    .split("_")
    .map((part) => `${part.charAt(0).toLocaleUpperCase("en")}${part.slice(1)}`)
    .join(" ");
}
