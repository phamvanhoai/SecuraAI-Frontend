"use client";

import { useCallback, useState } from "react";
import { MetricStrip, ProductPageHeader, ProductPanel } from "@/components/data-display/static-product";
import { useSessionUser } from "@/features/authentication-account";
import { useWorkflowDefinitions } from "../hooks/use-workflows";
import { WorkflowListFilters } from "./workflow-list-filters";
import { WorkflowListTable } from "./workflow-list-table";
import type {
  QueryWorkflowDefinitionsInput,
  WorkflowEntityType,
} from "../schemas/workflow-schema";

export function WorkflowManagementView() {
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const canCreate = permissions.includes("workflows.create");

  const [query, setQuery] = useState<QueryWorkflowDefinitionsInput>({
    page: 1,
    limit: 10,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const { data, isLoading, isError, error, refetch } = useWorkflowDefinitions(query);

  const handleSearchChange = useCallback((search: string | undefined) => {
    setQuery((prev) => {
      const next = { ...prev, page: 1 };
      if (search !== undefined) next.search = search;
      else delete next.search;
      return next;
    });
  }, []);

  const handleEntityTypeChange = useCallback((entityType: WorkflowEntityType | undefined) => {
    setQuery((prev) => {
      const next = { ...prev, page: 1 };
      if (entityType !== undefined) next.entityType = entityType;
      else delete next.entityType;
      return next;
    });
  }, []);

  const handleStatusChange = useCallback((isActive: boolean | undefined) => {
    setQuery((prev) => {
      const next = { ...prev, page: 1 };
      if (isActive !== undefined) next.isActive = isActive;
      else delete next.isActive;
      return next;
    });
  }, []);

  const handleSortChange = useCallback(
    (field: "name" | "entityType" | "createdAt" | "updatedAt" | "isActive") => {
      setQuery((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
        page: 1,
      }));
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setQuery({
      page: 1,
      limit: 10,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setQuery((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setQuery((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  const hasActiveFilters = Boolean(
    (query.search && query.search.length > 0) ||
      query.entityType ||
      query.isActive !== undefined,
  );

  const summary = data?.summary ?? { total: 0, active: 0, inactive: 0 };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <ProductPageHeader
        description="Quản lý và thiết lập các bước phê duyệt đa cấp tùy chỉnh (Custom Multi-step Approval Pipelines) cho rủi ro, chính sách và sự cố."
        {...(canCreate
          ? {
              primaryAction: "Tạo quy trình mới",
              onPrimaryAction: () => {
                // Future modal / route trigger for UC 91 Create Step Builder
              },
            }
          : {})}
        showSampleNotice={false}
        title="Quy trình phê duyệt"
      />

      {/* Global Summary Metrics */}
      <MetricStrip
        ariaLabel="Thống kê quy trình phê duyệt toàn hệ thống"
        metrics={[
          {
            label: "Tổng số quy trình",
            value: String(summary.total),
            detail: "Quy trình đã cấu hình trong hệ thống",
            tone: "brand",
            loading: isLoading,
          },
          {
            label: "Đang hoạt động",
            value: String(summary.active),
            detail: "Sẵn sàng tiếp nhận yêu cầu phê duyệt",
            tone: "neutral",
            loading: isLoading,
          },
          {
            label: "Tạm dừng",
            value: String(summary.inactive),
            detail: "Đang vô hiệu hóa / chưa kích hoạt",
            tone: "warning",
            loading: isLoading,
          },
        ]}
      />

      {/* Main Table Panel */}
      <ProductPanel
        description="Danh sách các mẫu quy trình phê duyệt tùy biến theo từng loại thực thể nghiệp vụ."
        title="Danh sách định nghĩa quy trình"
      >
        <div className="bg-surface border-border flex flex-col rounded-lg border">
          <WorkflowListFilters
            {...(query.entityType !== undefined ? { entityType: query.entityType } : {})}
            {...(query.isActive !== undefined ? { isActive: query.isActive } : {})}
            {...(query.search !== undefined ? { search: query.search } : {})}
            onEntityTypeChange={handleEntityTypeChange}
            onReset={handleResetFilters}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
          />

          <WorkflowListTable
            canCreate={canCreate}
            error={error}
            hasFilters={hasActiveFilters}
            isError={isError}
            isLoading={isLoading}
            items={data?.items ?? []}
            onLimitChange={handleLimitChange}
            onPageChange={handlePageChange}
            onResetFilters={handleResetFilters}
            onRetry={() => void refetch()}
            onSortChange={handleSortChange}
            {...(data?.pagination !== undefined ? { pagination: data.pagination } : {})}
            sortBy={query.sortBy ?? "updatedAt"}
            sortOrder={query.sortOrder ?? "desc"}
          />
        </div>
      </ProductPanel>
    </div>
  );
}
