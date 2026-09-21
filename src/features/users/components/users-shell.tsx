"use client";

import { Eye, LockKeyhole, Pencil, Search, UnlockKeyhole } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Pagination } from "@/components/data-display/pagination";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AuthSessionUser } from "@/features/auth";
import type { UserListQuery, UserListResponse } from "../schemas/user-schema";
import { UserDetailDialog } from "./user-detail-dialog";
import { EditUserDialog } from "./edit-user-dialog";

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

function parseStatus(value: string): UserListQuery["status"] | "" {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "locked" ||
    value === "disabled"
  ) {
    return value;
  }
  return "";
}

function userRows(
  data: UserListResponse,
  actor: AuthSessionUser,
  select: (selection: AccountLockSelection) => void,
  view: (userId: string) => void,
  edit: (userId: string) => void,
  canUpdate: boolean,
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
      <div
        className="grid min-w-[23rem] grid-cols-3 items-center gap-2"
        key={user.id + "-actions"}
      >
        <Button
          aria-label={`View ${user.fullName}`}
          className="w-full px-2"
          onClick={() => view(user.id)}
          variant="secondary"
        >
          <Eye className="size-4" strokeWidth={1.8} aria-hidden="true" />
          View
        </Button>
        <Button
          aria-label={`Edit ${user.fullName}`}
          className="w-full px-2"
          disabled={!canUpdate}
          onClick={() => edit(user.id)}
          title={canUpdate ? undefined : "Requires users.update permission"}
          variant="secondary"
        >
          <Pencil className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Edit
        </Button>
        {action ? (
          <Button
            variant="secondary"
            className={
              action === "lock"
                ? "text-danger w-full px-2"
                : "text-brand w-full px-2"
            }
            aria-label={
              (action === "lock" ? "Lock " : "Unlock ") + user.fullName
            }
            onClick={() => select({ user, action })}
          >
            <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
            {action === "lock" ? "Lock" : "Unlock"}
          </Button>
        ) : (
          <span
            key={user.id + "-action"}
            className="text-muted flex min-h-11 items-center justify-center text-center text-xs"
          >
            {user.id === actor.id ? "Your account" : "—"}
          </span>
        )}
      </div>,
    ];
  });
}

export function UsersShell() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [status, setStatus] = useState<UserListQuery["status"] | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selection, setSelection] = useState<AccountLockSelection | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const session = useSessionUser();
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  const canRead = session.data?.permissions.includes("users.read") ?? false;
  const canUpdate = session.data?.permissions.includes("users.update") ?? false;
  const users = useUsers(
    {
      page,
      limit: 20,
      ...(appliedSearch ? { q: appliedSearch } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(roleCode ? { roleCode } : {}),
      ...(status ? { status } : {}),
    },
    canRead,
  );

  const departments = useMemo(() => {
    const options = new Map<string, string>();
    for (const user of users.data?.items ?? []) {
      if (user.department)
        options.set(user.department.id, user.department.name);
    }
    if (departmentId && !options.has(departmentId)) {
      options.set(departmentId, "Selected department");
    }
    return [...options].sort((left, right) => left[1].localeCompare(right[1]));
  }, [departmentId, users.data?.items]);

  const roles = useMemo(() => {
    const options = new Map<string, string>();
    for (const user of users.data?.items ?? []) {
      for (const role of user.roles) options.set(role.code, role.name);
    }
    if (roleCode && !options.has(roleCode)) options.set(roleCode, roleCode);
    return [...options].sort((left, right) => left[1].localeCompare(right[1]));
  }, [roleCode, users.data?.items]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(searchDraft.trim());
    setPage(1);
  }

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
        <div className="border-border flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-end xl:justify-between">
          <form className="w-full xl:max-w-sm" onSubmit={submitSearch}>
            <label className="block" htmlFor="user-search">
              <span className="mb-1 block text-sm font-medium">
                Search users
              </span>
              <span className="relative block">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  aria-describedby="user-search-hint"
                  className="pl-9"
                  id="user-search"
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Name, email, or employee code"
                  type="search"
                  value={searchDraft}
                />
              </span>
            </label>
            <span className="sr-only" id="user-search-hint">
              Press Enter to search.
            </span>
          </form>
          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:grid-cols-[minmax(170px,1fr)_minmax(150px,1fr)_minmax(140px,1fr)]">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Department</span>
              <Select
                aria-label="Department"
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setPage(1);
                }}
                value={departmentId}
              >
                <option value="">All departments</option>
                {departments.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Role</span>
              <Select
                aria-label="Role"
                onChange={(event) => {
                  setRoleCode(event.target.value);
                  setPage(1);
                }}
                value={roleCode}
              >
                <option value="">All roles</option>
                {roles.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Status</span>
              <Select
                aria-label="Status"
                onChange={(event) => {
                  setStatus(parseStatus(event.target.value));
                  setPage(1);
                }}
                value={status}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="locked">Locked</option>
                <option value="disabled">Disabled</option>
              </Select>
            </label>
          </div>
        </div>
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
            rows={userRows(
              data,
              session.data,
              setSelection,
              setDetailUserId,
              setEditUserId,
              canUpdate,
            )}
          />
        )}
        <div className="border-border flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted text-sm">
            Showing {firstItem}-{lastItem} of {data.pagination.total} users
          </span>
          <Pagination
            page={data.pagination.page}
            pageCount={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      </ProductPanel>
      <AccountLockDialog
        selection={selection}
        onClose={() => setSelection(null)}
      />
      <UserDetailDialog
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />
      <EditUserDialog userId={editUserId} onClose={() => setEditUserId(null)} />
      {isAdmin ? (
        <CreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </>
  );
}
