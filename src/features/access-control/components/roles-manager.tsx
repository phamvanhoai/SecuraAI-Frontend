"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/api-error";
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from "../hooks/use-roles";
import type { Permission, Role, RoleFormValues } from "../schemas/role-schema";
import { RoleFormDialog } from "./role-form-dialog";

const PAGE_SIZE = 20;

function userError(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
  const messages: Partial<Record<string, string>> = {
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    UNAUTHENTICATED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    CONFLICT: "Dữ liệu vai trò đang bị trùng hoặc vai trò vẫn được sử dụng.",
    VALIDATION_FAILED: "Dữ liệu vai trò hoặc danh sách quyền không hợp lệ.",
  };
  return (
    messages[error.code] ?? "Không thể hoàn tất yêu cầu. Vui lòng thử lại."
  );
}

export function RolesManager() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const roles = useRoles({
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
  });
  const permissionCatalog = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const permissions: readonly Permission[] =
    permissionCatalog.data?.items ?? [];

  const columns: readonly DataTableColumn<Role>[] = [
    {
      key: "role",
      header: "Vai trò",
      cell: (role) => (
        <span>
          <span className="block font-medium">{role.name}</span>
          <span className="text-muted text-xs">
            {role.description ?? "Không có mô tả"}
          </span>
        </span>
      ),
    },
    {
      key: "code",
      header: "Mã",
      cell: (role) => <code className="text-xs">{role.code}</code>,
    },
    {
      key: "users",
      header: "Người dùng",
      cell: (role) => role.assignedUserCount,
    },
    {
      key: "permissions",
      header: "Quyền",
      cell: (role) => role.permissions.length,
    },
    {
      key: "type",
      header: "Loại",
      cell: (role) => (
        <StatusBadge tone={role.isSystem ? "success" : "info"}>
          {role.isSystem ? "Hệ thống" : "Tùy chỉnh"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      cell: (role) =>
        role.isSystem ? (
          <span className="text-muted text-xs">Chỉ xem</span>
        ) : (
          <div className="flex gap-1">
            <button
              aria-label={`Sửa vai trò ${role.name}`}
              className="hover:bg-neutral-soft focus-visible:outline-brand rounded-md p-2 focus-visible:outline-2"
              onClick={() => openEdit(role)}
              type="button"
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label={`Xóa vai trò ${role.name}`}
              className="text-danger hover:bg-danger-soft focus-visible:outline-danger rounded-md p-2 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={deleteMutation.isPending}
              onClick={() => void remove(role)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
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
        toast.success("Đã cập nhật vai trò");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Đã tạo vai trò");
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      setFormError(userError(error));
    }
  }

  async function remove(role: Role): Promise<void> {
    if (
      !window.confirm(
        `Xóa vai trò “${role.name}”? Thao tác này không thể hoàn tác.`,
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync(role.id);
      toast.success("Đã xóa vai trò");
      if (roles.data?.items.length === 1 && page > 1) setPage(page - 1);
    } catch (error: unknown) {
      toast.error("Không thể xóa vai trò", userError(error));
    }
  }

  const items = roles.data?.items ?? [];
  const systemCount = items.filter((role) => role.isSystem).length;
  const assignedCount = items.reduce(
    (sum, role) => sum + role.assignedUserCount,
    0,
  );

  return (
    <>
      <ProductPageHeader
        title="Vai trò và quyền"
        description="Quản lý vai trò tùy chỉnh và phạm vi quyền truy cập do backend kiểm soát."
        onPrimaryAction={openCreate}
        primaryAction="Tạo vai trò"
        showSampleNotice={false}
      />
      <MetricStrip
        ariaLabel="Chỉ số vai trò"
        metrics={[
          {
            label: "Tổng vai trò",
            value: String(roles.data?.pagination.total ?? 0),
            detail: `${systemCount} vai trò hệ thống trên trang`,
            tone: "brand",
          },
          {
            label: "Quyền truy cập",
            value: String(permissions.length),
            detail: "Backend trả về trên trang hiện tại",
            tone: "neutral",
          },
          {
            label: "Người dùng đã gán",
            value: String(assignedCount),
            detail: "Trong các vai trò trên trang",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel title="Danh sách vai trò">
        <form
          className="border-border flex gap-2 border-b p-4"
          onSubmit={submitSearch}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Tìm vai trò</span>
            <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              className="border-border bg-background placeholder:text-muted focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-3"
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm theo tên hoặc mã vai trò"
              value={searchDraft}
            />
          </label>
          <Button className="min-h-10" type="submit">
            Tìm kiếm
          </Button>
        </form>
        <div className="p-4">
          {roles.isPending ? (
            <div aria-label="Đang tải danh sách vai trò" className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton className="h-14" key={item} />
              ))}
            </div>
          ) : roles.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {userError(roles.error)}{" "}
              <button
                className="ml-2 underline"
                onClick={() => void roles.refetch()}
                type="button"
              >
                Thử lại
              </button>
            </Alert>
          ) : items.length === 0 ? (
            <EmptyState
              title="Không có vai trò"
              description={
                search
                  ? "Không tìm thấy vai trò phù hợp với từ khóa."
                  : "Backend chưa có vai trò nào."
              }
            />
          ) : (
            <DataTable
              columns={columns}
              getRowKey={(role) => role.id}
              rows={items}
            />
          )}
          {roles.data && roles.data.pagination.totalPages > 1 ? (
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
    </>
  );
}
