"use client";

import {
  Activity,
  Building2,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useUserDetail } from "../hooks/use-user-detail";
import type { UserDetail } from "../schemas/user-schema";

const statusPresentation = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  locked: { label: "Locked", tone: "warning" },
  disabled: { label: "Disabled", tone: "danger" },
} as const;

export function UserDetailDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detail = useUserDetail(userId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (userId && !dialog.open) dialog.showModal();
    if (!userId && dialog.open) dialog.close();
  }, [userId]);

  const status = detail.data ? statusPresentation[detail.data.status] : null;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="User details"
    >
      {detail.isPending ? (
        <p className="text-muted py-10 text-center" role="status">
          Loading user details…
        </p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">Unable to load user details</strong>
          <span>
            The account may no longer exist or you may not have access.
          </span>
          <Button
            className="mt-3"
            onClick={() => void detail.refetch()}
            variant="secondary"
          >
            Try again
          </Button>
        </Alert>
      ) : null}
      {detail.data && status ? (
        <div className="space-y-5">
          <div className="bg-neutral-soft flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-brand-soft text-brand grid size-12 shrink-0 place-items-center rounded-xl font-semibold">
                {initials(detail.data.fullName)}
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-[-0.02em]">
                  {detail.data.fullName}
                </h3>
                <p className="text-muted mt-1 flex items-center gap-1.5 text-sm [overflow-wrap:anywhere]">
                  <Mail
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  {detail.data.email}
                </p>
              </div>
            </div>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>

          <DetailSection
            icon={
              <UserRound
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            }
            title="Account information"
          >
            <Detail
              label="Employee code"
              value={detail.data.employeeCode ?? "Not assigned"}
            />
            <Detail
              icon={
                <Building2
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.8}
                />
              }
              label="Department"
              value={detail.data.department?.name ?? "Not assigned"}
            />
            <Detail
              label="Department code"
              value={detail.data.department?.code ?? "Not assigned"}
            />
            <Detail
              label="Email verification"
              value={detail.data.emailVerifiedAt ? "Verified" : "Not verified"}
            />
            <Detail
              label="Password status"
              value={
                detail.data.mustChangePassword
                  ? "Password change required"
                  : "No change required"
              }
            />
          </DetailSection>

          <section
            aria-labelledby="assigned-roles-heading"
            className="border-border rounded-xl border p-4"
          >
            <SectionHeading
              icon={
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              }
              id="assigned-roles-heading"
              title="Assigned roles"
            />
            {detail.data.roles.length === 0 ? (
              <p className="bg-neutral-soft text-muted rounded-lg px-3 py-4 text-sm">
                No roles assigned.
              </p>
            ) : (
              <ul className="space-y-2">
                {detail.data.roles.map((role) => (
                  <li
                    className="bg-neutral-soft rounded-lg px-3 py-3"
                    key={role.id}
                  >
                    <div className="flex items-start gap-2.5">
                      <KeyRound
                        aria-hidden="true"
                        className="text-brand mt-0.5 size-4 shrink-0"
                        strokeWidth={1.8}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{role.name}</p>
                        <p className="text-muted mt-0.5 text-xs [overflow-wrap:anywhere]">
                          {role.code}
                          {role.description ? ` — ${role.description}` : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DetailSection
            icon={
              <Activity
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            }
            title="Account activity"
          >
            <Detail
              label="Last login"
              value={formatDate(detail.data.lastLoginAt)}
            />
            <Detail
              label="Last locked"
              value={formatDate(detail.data.lastLockedAt)}
            />
            <Detail label="Created" value={formatDate(detail.data.createdAt)} />
            <Detail
              label="Last updated"
              value={formatDate(detail.data.updatedAt)}
            />
          </DetailSection>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => dialogRef.current?.close()} variant="secondary">
          Close
        </Button>
      </div>
    </Dialog>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const id = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;
  return (
    <section
      aria-labelledby={id}
      className="border-border rounded-xl border p-4"
    >
      <SectionHeading id={id} icon={icon} title={title} />
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function SectionHeading({
  id,
  icon,
  title,
}: {
  id: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold" id={id}>
      <span className="bg-brand-soft text-brand grid size-7 place-items-center rounded-lg">
        {icon}
      </span>
      {title}
    </h4>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium [overflow-wrap:anywhere]">
        {value ?? "Not available"}
      </dd>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();
}

function formatDate(value: UserDetail["lastLoginAt"]): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
