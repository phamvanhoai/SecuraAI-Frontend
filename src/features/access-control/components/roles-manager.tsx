"use client";

import { Ellipsis, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/api-error";
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoleMetrics,
  useRoles,
  useUpdateRole,
} from "../hooks/use-roles";
import type { Permission, Role, RoleFormValues } from "../schemas/role-schema";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleDetailDialog } from "./role-detail-dialog";

const PAGE_SIZE = 20;

function userError(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Unable to complete the request. Please try again.";
  const messages: Partial<Record<string, string>> = {
    FORBIDDEN: "You do not have permission to perform this action.",
    UNAUTHENTICATED: "Your session has expired. Please sign in again.",
    CONFLICT: "The role already exists or is still in use.",
    VALIDATION_FAILED: "The role data or permission list is invalid.",
  };
  return (
    messages[error.code] ?? "Unable to complete the request. Please try again."
  );
}

export function RolesManager() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const roles = useRoles({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
  });
  const metrics = useRoleMetrics();
  const permissionCatalog = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const permissions: readonly Permission[] =
    permissionCatalog.data?.items ?? [];

  const columns: readonly DataTableColumn<Role>[] = [
    {
      key: "role",
      header: "Role",
      cell: (role) => (
        <span>
          <span className="block font-medium">{role.name}</span>
          <span className="text-muted text-xs">
            {role.description ?? "No description"}
          </span>
        </span>
      ),
    },
    {
      key: "code",
      header: "Code",
      cell: (role) => <code className="text-xs">{role.code}</code>,
    },
    {
      key: "users",
      header: "Users",
      cell: (role) => role.assignedUserCount,
    },
    {
      key: "permissions",
      header: "Permissions",
      cell: (role) => role.permissions.length,
    },
    {
      key: "type",
      header: "Type",
      cell: (role) => (
        <StatusBadge tone={role.isSystem ? "success" : "info"}>
          {role.isSystem ? "System" : "Custom"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (role) => (
        <DropdownMenu
          className="w-fit"
          label={
            <span className="grid size-6 place-items-center">
              <span className="sr-only">Actions for {role.name}</span>
              <Ellipsis
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
            </span>
          }
        >
          <button
            className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
            onClick={() => setViewingRole(role)}
            type="button"
          >
            <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
            View details
          </button>
          {!role.isSystem ? (
            <>
              <button
                className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                onClick={() => openEdit(role)}
                type="button"
              >
                <Pencil
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Edit
              </button>
              <button
                className="text-danger hover:bg-danger-soft focus-visible:outline-danger flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={deleteMutation.isPending}
                onClick={() => void remove(role)}
                type="button"
              >
                <Trash2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                Delete
              </button>
            </>
          ) : null}
        </DropdownMenu>
      ),
    },
  ];

  function openCreate(): void {
    setEditingRole(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(role: Role): void {
    setEditingRole(role);
    setFormError(null);
    setDialogOpen(true);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  async function save(values: RoleFormValues): Promise<void> {
    setFormError(null);
    try {
      if (editingRole) {
        await updateMutation.mutateAsync({ id: editingRole.id, input: values });
        toast.success("Role updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Role created");
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      setFormError(userError(error));
    }
  }

  async function remove(role: Role): Promise<void> {
    if (
      !window.confirm(
        `Delete role “${role.name}”? This action cannot be undone.`,
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync(role.id);
      toast.success("Role deleted");
      if (roles.data?.items.length === 1 && page > 1) setPage(page - 1);
    } catch (error: unknown) {
      toast.error("Unable to delete role", userError(error));
    }
  }

  const items = roles.data?.items ?? [];

  return (
    <>
      <ProductPageHeader
        title="Roles and permissions"
        description="Manage custom roles and backend-enforced permission scopes."
        onPrimaryAction={openCreate}
        primaryAction="Create role"
        showSampleNotice={false}
      />
      <MetricStrip
        ariaLabel="Role metrics"
        metrics={[
          {
            label: "Total roles",
            value: metrics.data ? String(metrics.data.total) : "—",
            detail: metrics.data
              ? `${metrics.data.system} system roles`
              : "Across all roles",
            tone: "brand",
            loading: metrics.isPending,
          },
          {
            label: "Permissions",
            value: String(permissions.length),
            detail: "Returned by the backend",
            tone: "neutral",
            loading: permissionCatalog.isPending,
          },
          {
            label: "Assigned users",
            value: metrics.data ? String(metrics.data.assignedUsers) : "—",
            detail: "Across all roles",
            tone: "neutral",
            loading: metrics.isPending,
          },
          {
            label: "Custom roles",
            value: metrics.data
              ? String(metrics.data.total - metrics.data.system)
              : "—",
            detail: "Backend-managed non-system roles",
            tone: "neutral",
            loading: metrics.isPending,
          },
        ]}
      />
      <ProductPanel title="Role list">
        <form
          className="border-border flex gap-2 border-b p-4"
          onSubmit={submitSearch}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search roles</span>
            <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              className="border-border bg-background placeholder:text-muted focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-3"
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by role name or code"
              value={searchDraft}
            />
          </label>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
        </form>
        <div className="p-4">
          {roles.isPending ? (
            <TableSkeleton columns={6} label="Loading roles" />
          ) : roles.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {userError(roles.error)}{" "}
              <button
                className="ml-2 underline"
                onClick={() => void roles.refetch()}
                type="button"
              >
                Try again
              </button>
            </Alert>
          ) : items.length === 0 ? (
            <EmptyState
              title="No roles"
              description={
                search
                  ? "No roles match your search."
                  : "The backend has no roles yet."
              }
            />
          ) : (
            <DataTable
              columns={columns}
              getRowKey={(role) => role.id}
              rows={items}
            />
          )}
          {roles.data ? (
            <div className="mt-4">
              <Pagination
                page={page}
                pageCount={roles.data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </div>
      </ProductPanel>
      <RoleFormDialog
        errorMessage={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={save}
        open={dialogOpen}
        pending={createMutation.isPending || updateMutation.isPending}
        permissions={permissions}
        role={editingRole}
      />
      <RoleDetailDialog
        role={viewingRole}
        onClose={() => setViewingRole(null)}
      />
    </>
  );
}
