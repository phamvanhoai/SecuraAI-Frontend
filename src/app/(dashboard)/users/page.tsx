"use client";

import { MoreHorizontal } from "lucide-react";
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
import { CreateUserDialog, useUsers } from "@/features/users";
import type { UserListResponse } from "@/features/users/schemas/user-schema";

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

function RowMenu() {
  return (
    <button
      aria-label="User options"
      className="text-muted hover:bg-neutral-soft grid size-8 place-items-center rounded-md"
      type="button"
    >
      <MoreHorizontal className="size-4" />
    </button>
  );
}

function statusLabel(status: UserListResponse["items"][number]["status"]): string {
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

function userRows(data: UserListResponse) {
  return data.items.map((user) => [
    <UserCell email={user.email} key={`${user.id}-user`} name={user.fullName} />,
    user.employeeCode,
    user.department?.name ?? "Not assigned",
    user.roles.map((role) => role.name).join(", ") || "No role assigned",
    <StatusBadge key={`${user.id}-status`} tone={statusTone(user.status)}>
      {statusLabel(user.status)}
    </StatusBadge>,
    <RowMenu key={`${user.id}-menu`} />,
  ]);
}

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const session = useSessionUser();
  const isAdmin = session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  const users = useUsers({ page: 1, limit: 20 }, session.isSuccess);

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
  const firstItem = data.pagination.total === 0
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
            headers={["User", "Employee code", "Department", "Role", "Status", ""]}
            rows={userRows(data)}
          />
        )}
        <PaginationBar
          label={`Showing ${firstItem}-${lastItem} of ${data.pagination.total} users`}
        />
      </ProductPanel>
      {isAdmin ? (
        <CreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </>
  );
}