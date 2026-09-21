"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitBranch,
  Layers,
  Plus,
  RotateCcw,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowEntityTypeBadge } from "./workflow-entity-type-badge";
import { WorkflowStatusBadge } from "./workflow-status-badge";
import type {
  WorkflowDefinitionItem,
  WorkflowPagination,
} from "../schemas/workflow-schema";

interface WorkflowListTableProps {
  items: WorkflowDefinitionItem[];
  pagination?: WorkflowPagination | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null | undefined;
  hasFilters: boolean;
  canCreate: boolean;
  sortBy: "name" | "entityType" | "createdAt" | "updatedAt" | "isActive";
  sortOrder: "asc" | "desc";
  onSortChange: (
    field: "name" | "entityType" | "createdAt" | "updatedAt" | "isActive",
  ) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onResetFilters: () => void;
  onCreateWorkflow?: (() => void) | undefined;
  onViewWorkflow?: ((workflow: WorkflowDefinitionItem) => void) | undefined;
  onRetry: () => void;
}

export function WorkflowListTable({
  items,
  pagination,
  isLoading,
  isError,
  error,
  hasFilters,
  canCreate,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onLimitChange,
  onResetFilters,
  onCreateWorkflow,
  onViewWorkflow,
  onRetry,
}: WorkflowListTableProps) {
  const renderSortIcon = (
    field: "name" | "entityType" | "createdAt" | "updatedAt" | "isActive",
  ) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="size-3.5 opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="text-brand size-3.5" />
    ) : (
      <ArrowDown className="text-brand size-3.5" />
    );
  };

  if (isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <div className="bg-danger-soft text-danger mb-3 grid size-12 place-items-center rounded-full">
          <RotateCcw className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Không thể tải danh sách quy trình
        </h3>
        <p className="text-muted mt-1.5 max-w-md text-sm">
          {error?.message || "Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại."}
        </p>
        <button
          className="bg-brand hover:bg-brand/90 focus-visible:outline-brand mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-2"
          onClick={onRetry}
          type="button"
        >
          <RotateCcw className="size-4" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <caption className="sr-only">Danh sách quy trình phê duyệt tùy chỉnh</caption>
          <thead className="text-muted dark:bg-neutral-soft bg-[#f7f9fd] text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">
                <button
                  className="hover:text-foreground inline-flex items-center gap-1.5 font-semibold transition-colors"
                  onClick={() => onSortChange("name")}
                  type="button"
                >
                  Tên quy trình
                  {renderSortIcon("name")}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                <button
                  className="hover:text-foreground inline-flex items-center gap-1.5 font-semibold transition-colors"
                  onClick={() => onSortChange("entityType")}
                  type="button"
                >
                  Loại thực thể
                  {renderSortIcon("entityType")}
                </button>
              </th>
              <th className="px-4 py-3 text-center font-semibold" scope="col">
                Số bước
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                <button
                  className="hover:text-foreground inline-flex items-center gap-1.5 font-semibold transition-colors"
                  onClick={() => onSortChange("isActive")}
                  type="button"
                >
                  Trạng thái
                  {renderSortIcon("isActive")}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                <button
                  className="hover:text-foreground inline-flex items-center gap-1.5 font-semibold transition-colors"
                  onClick={() => onSortChange("updatedAt")}
                  type="button"
                >
                  Người tạo & Ngày cập nhật
                  {renderSortIcon("updatedAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {isLoading ? (
              Array.from({ length: pagination?.limit || 5 }).map((_, index) => (
                <tr className="animate-pulse" key={index}>
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="mt-1.5 h-3 w-64" />
                  </td>
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-6 w-32 rounded-md" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Skeleton className="mx-auto h-5 w-8 rounded-full" />
                  </td>
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </td>
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1.5 h-3 w-24" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Skeleton className="ml-auto h-8 w-16 rounded-md" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center" colSpan={6}>
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-neutral-soft text-muted mb-3 grid size-12 place-items-center rounded-full">
                      <GitBranch className="size-6" />
                    </div>
                    {hasFilters ? (
                      <>
                        <h4 className="text-base font-medium text-foreground">
                          Không tìm thấy quy trình phù hợp
                        </h4>
                        <p className="text-muted mt-1 max-w-sm text-sm">
                          Không có quy trình nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
                        </p>
                        <button
                          className="border-border bg-surface hover:bg-neutral-soft mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors"
                          onClick={onResetFilters}
                          type="button"
                        >
                          Xóa bộ lọc
                        </button>
                      </>
                    ) : (
                      <>
                        <h4 className="text-base font-medium text-foreground">
                          Chưa có quy trình phê duyệt nào
                        </h4>
                        <p className="text-muted mt-1 max-w-sm text-sm">
                          Hệ thống chưa thiết lập quy trình phê duyệt tùy chỉnh nào.
                        </p>
                        {canCreate && (
                          <button
                            className="bg-brand hover:bg-brand/90 focus-visible:outline-brand mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
                            onClick={onCreateWorkflow}
                            type="button"
                          >
                            <Plus className="size-4" />
                            Tạo quy trình đầu tiên
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((workflow) => (
                <tr
                  className="hover:bg-neutral-soft/50 transition-colors"
                  key={workflow.workflowId}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {workflow.name}
                      </span>
                      {workflow.description && (
                        <span className="text-muted mt-0.5 max-w-md truncate text-xs">
                          {workflow.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <WorkflowEntityTypeBadge entityType={workflow.entityType} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="bg-neutral-soft text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      <Layers className="size-3 text-muted" />
                      {workflow.stepsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <WorkflowStatusBadge isActive={workflow.isActive} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="size-3 text-muted" />
                        {workflow.createdBy?.name ?? "Hệ thống"}
                      </span>
                      <span className="text-muted mt-0.5 flex items-center gap-1">
                        <Calendar className="size-3 text-muted" />
                        {new Date(workflow.updatedAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      aria-label={`Xem chi tiết quy trình ${workflow.name}`}
                      className="border-border bg-surface hover:bg-neutral-soft hover:text-brand inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                      onClick={() => onViewWorkflow?.(workflow)}
                      type="button"
                    >
                      <Eye className="size-3.5" />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.total > 0 && (
        <div className="border-border flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
          <div className="text-muted flex items-center gap-2 text-xs">
            <span>
              Hiển thị{" "}
              <strong className="text-foreground">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-foreground">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              trong tổng số{" "}
              <strong className="text-foreground">{pagination.total}</strong> quy trình
            </span>
            <span className="text-muted">|</span>
            <label className="flex items-center gap-1">
              <span>Mỗi trang:</span>
              <select
                className="border-border bg-surface rounded border px-1.5 py-0.5 text-xs outline-none"
                onChange={(e) => onLimitChange(Number(e.target.value))}
                value={pagination.limit}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-label="Trang trước"
              className="border-border bg-surface hover:bg-neutral-soft disabled:opacity-40 grid size-8 place-items-center rounded-lg border text-xs transition-colors"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange(pagination.page - 1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 text-xs font-medium">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              aria-label="Trang sau"
              className="border-border bg-surface hover:bg-neutral-soft disabled:opacity-40 grid size-8 place-items-center rounded-lg border text-xs transition-colors"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.page + 1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
