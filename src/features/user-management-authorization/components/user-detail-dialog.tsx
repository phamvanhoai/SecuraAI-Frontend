"use client";

import {
  Activity,
  AlertTriangle,
  KeyRound,
  Mail,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
      {/* Loading skeleton */}
      {detail.isPending ? (
        <div
          className="space-y-5"
          role="status"
          aria-label="Loading user details"
        >
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      ) : null}

      {/* Error banner */}
      {detail.isError ? (
        <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
          <div className="flex gap-2.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-danger"
              strokeWidth={1.8}
            />
            <div>
              <p className="text-sm font-medium text-danger">
                Unable to load user details
              </p>
              <p className="mt-0.5 text-xs text-muted">
                The account may no longer exist or you may not have access.
              </p>
            </div>
          </div>
          <Button
            onClick={() => void detail.refetch()}
            variant="secondary"
            type="button"
            className="min-h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {detail.data && status ? (
        <div className="space-y-5">
          {/* Context bar — identity */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <span className="bg-brand-soft text-brand grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold">
              {initials(detail.data.fullName)}
            </span>
            <span className="font-medium text-foreground text-sm">
              {detail.data.fullName}
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-muted">
              <Mail className="size-3.5 shrink-0" strokeWidth={1.8} />
              {detail.data.email}
            </span>
            <span className="text-border">·</span>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>

          {/* Account information */}
          <DetailSection icon={<UserRound className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />} title="Account information">
            <Detail label="Full name" value={detail.data.fullName} />
            <Detail label="Username" value={detail.data.username} />
            <Detail
              label="Employee code"
              value={detail.data.employeeCode ?? "Not assigned"}
            />
            <Detail label="Phone" value={detail.data.phone ?? "Not provided"} />
            <Detail
              label="Department"
              value={detail.data.department?.name ?? "Not assigned"}
            />
            <Detail
              label="Department code"
              value={detail.data.department?.code ?? "Not assigned"}
            />
          </DetailSection>

          {/* Access assignment */}
          <DetailSection icon={<KeyRound className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />} title="Access assignment">
            <Detail label="Role" value={detail.data.role.name} />
            <Detail label="Role code" value={detail.data.role.code} />
          </DetailSection>

          {/* Account activity */}
          <DetailSection icon={<Activity className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />} title="Account activity">
            <Detail
              label="Last login"
              value={formatDate(detail.data.lastLoginAt)}
            />
            <Detail
              label="Password changed"
              value={formatDate(detail.data.passwordChangedAt)}
            />
            <Detail label="Created" value={formatDate(detail.data.createdAt)} />
            <Detail
              label="Last updated"
              value={formatDate(detail.data.updatedAt)}
            />
          </DetailSection>
        </div>
      ) : null}

      {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            onClick={() => dialogRef.current?.close()}
            variant="secondary"
            type="button"
          >
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
  const id = title.toLowerCase().replaceAll(" ", "-") + "-heading";
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-start gap-2 border-b border-border pb-2">
        {icon}
        <h4 className="text-sm font-semibold" id={id}>
          {title}
        </h4>
      </div>
      <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
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
