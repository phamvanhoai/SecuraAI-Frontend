"use client";

import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useState } from "react";
import {
  MetricStrip,
  PaginationBar,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useSessionUser } from "@/features/auth";
import { CreateUserDialog } from "./create-user-dialog";
import { useUsers } from "../hooks/use-users";
import { accountLockAction } from "../lib/account-lock";
import {
  AccountLockDialog,
  type AccountLockSelection,
} from "./account-lock-dialog";
import { Button } from "@/components/ui/button";
import type { AuthSessionUser } from "@/features/auth";
import type { UserListResponse } from "../schemas/user-schema";

function UserCell({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold">
        {initials}
      </span>
      <span>
        <span className="block font-medium">{name}</span>
        <span className="text-muted block text-xs">{email}</span>
      </span>
    </div>
  );
}

function statusLabel(
  status: UserListResponse["items"][number]["status"],
): string {
  return {
    active: "Active",
    inactive: "Inactive",
    locked: "Locked",
    disabled: "Disabled",
  }[status];
}

function statusTone(
  status: UserListResponse["items"][number]["status"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "locked") return "warning";
  if (status === "disabled") return "danger";
  return "neutral";
}

function userRows(
  data: UserListResponse,
  actor: AuthSessionUser,
  select: (selection: AccountLockSelection) => void,
) {
  return data.items.map((user) => {
    const action = accountLockAction(actor, user);
    const Icon = action === "unlock" ? UnlockKeyhole : LockKeyhole;
    return [
      <UserCell
        email={user.email}
        key={`${user.id}-user`}
        name={user.fullName}
      />,
      user.employeeCode,
      user.department?.name ?? "Not assigned",
      user.roles.map((role) => role.name).join(", ") || "No role assigned",
      <StatusBadge key={`${user.id}-status`} tone={statusTone(user.status)}>
        {statusLabel(user.status)}
      </StatusBadge>,
      action ? (
        <Button
          key={user.id + "-action"}
          variant="secondary"
          className={action === "lock" ? "text-danger" : "text-brand"}
          aria-label={(action === "lock" ? "Lock " : "Unlock ") + user.fullName}
          onClick={() => select({ user, action })}
        >
          <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          {action === "lock" ? "Lock" : "Unlock"}
        </Button>
      ) : (
        <span key={user.id + "-action"} className="text-muted text-xs">
          {user.id === actor.id ? "Your account" : "—"}
        </span>
      ),
    ];
  });
}

export function UsersShell() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selection, setSelection] = useState<AccountLockSelection | null>(null);
  const session = useSessionUser();
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  const canRead = session.data?.permissions.includes("users.read") ?? false;
  const users = useUsers({ page: 1, limit: 20 }, canRead);

  if (session.isPending) return <DashboardLoadingSkeleton variant="table" />;

  if (session.isError || !session.data) {
    return (
      <>
        <ProductPageHeader
          title="User Management"
          description="Manage user accounts, departments, roles, and access status across the organization."
          showSampleNotice={false}
        />
        <EmptyState
          title="Session expired"
          description="Your session is no longer valid. Please sign in again and try again."
        />
      </>
    );
  }

  if (!canRead)
    return (
      <EmptyState
        title="Access denied"
        description="You do not have permission to view user accounts."
      />
    );

  if (users.isPending) return <DashboardLoadingSkeleton variant="table" />;

  if (users.isError) {
    return (
      <>
        <ProductPageHeader
          title="User Management"
          description="Manage user accounts, departments, roles, and access status across the organization."
          showSampleNotice={false}
        />
        <EmptyState
          title="Unable to load users"
          description={
            users.error instanceof Error
              ? users.error.message
              : "The user list could not be loaded from the backend. Please refresh and try again."
          }
        />
      </>
    );
  }

  const data = users.data;
  const firstItem =
    data.pagination.total === 0
      ? 0
      : (data.pagination.page - 1) * data.pagination.limit + 1;
  const lastItem = Math.min(
    data.pagination.page * data.pagination.limit,
    data.pagination.total,
  );

  return (
    <>
      <ProductPageHeader
        title="User Management"
        description="Manage user accounts, departments, roles, and access status across the organization."
        secondaryAction="Export list"
        showSampleNotice={false}
        {...(isAdmin
          ? {
              primaryAction: "Add user",
              onPrimaryAction: () => setCreateOpen(true),
            }
          : {})}
      />
      <MetricStrip
        ariaLabel="User summary"
        metrics={[
          {
            label: "Total users",
            value: String(data.pagination.total),
            detail: "All accounts",
            tone: "brand",
          },
          {
            label: "Active users",
            value: String(data.summary.active),
            detail: "Currently active",
            tone: "brand",
          },
          {
            label: "Locked users",
            value: String(data.summary.locked),
            detail: "Needs attention",
            tone: "warning",
          },
          {
            label: "Disabled users",
            value: String(data.summary.disabled),
            detail: "Disabled accounts",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel
        title="User list"
        description="User accounts returned by the administration service."
      >
        <ProductToolbar
          searchPlaceholder="Search by name, email, or employee code"
          filters={["Department", "Role", "Status"]}
        />
        {data.items.length === 0 ? (
          <EmptyState
            title="No users found"
            description="There are no user accounts matching the current request."
          />
        ) : (
          <StaticTable
            caption="User list"
            headers={[
              "User",
              "Employee code",
              "Department",
              "Role",
              "Status",
              "Actions",
            ]}
            rows={userRows(data, session.data, setSelection)}
          />
        )}
        <PaginationBar
          label={`Showing ${firstItem}-${lastItem} of ${data.pagination.total} users`}
        />
      </ProductPanel>
      <AccountLockDialog
        selection={selection}
        onClose={() => setSelection(null)}
      />
      {isAdmin ? (
        <CreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </>
  );
}
