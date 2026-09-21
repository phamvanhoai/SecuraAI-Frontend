"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  WORKFLOW_ENTITY_LABELS,
  WORKFLOW_ENTITY_TYPES,
  type WorkflowEntityType,
} from "../schemas/workflow-schema";

interface WorkflowListFiltersProps {
  search?: string | undefined;
  entityType?: WorkflowEntityType | undefined;
  isActive?: boolean | undefined;
  onSearchChange: (search: string | undefined) => void;
  onEntityTypeChange: (entityType: WorkflowEntityType | undefined) => void;
  onStatusChange: (isActive: boolean | undefined) => void;
  onReset: () => void;
}

export function WorkflowListFilters({
  search,
  entityType,
  isActive,
  onSearchChange,
  onEntityTypeChange,
  onStatusChange,
  onReset,
}: WorkflowListFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const trimmed = val.trim();
      onSearchChange(trimmed.length > 0 ? trimmed : undefined);
    }, 350);
  };

  const handleReset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLocalSearch("");
    onReset();
  };

  const hasActiveFilters = Boolean(
    (search && search.length > 0) || entityType || isActive !== undefined,
  );

  return (
    <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search input */}
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Tìm kiếm quy trình</span>
          <Search
            aria-hidden="true"
            className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            strokeWidth={1.8}
          />
          <input
            className="border-border bg-background placeholder:text-muted focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-3"
            onChange={handleInputChange}
            placeholder="Tìm theo tên, mô tả..."
            type="search"
            value={localSearch}
          />
        </label>

        {/* Entity Type select */}
        <label className="block sm:w-auto">
          <span className="sr-only">Lọc theo loại thực thể</span>
          <select
            className="border-border bg-surface text-foreground focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-3 sm:w-56"
            onChange={(e) =>
              onEntityTypeChange(
                e.target.value === "all"
                  ? undefined
                  : (e.target.value as WorkflowEntityType),
              )
            }
            value={entityType ?? "all"}
          >
            <option value="all">Tất cả loại thực thể</option>
            {WORKFLOW_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {WORKFLOW_ENTITY_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        {/* Status select */}
        <label className="block sm:w-auto">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select
            className="border-border bg-surface text-foreground focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-3 sm:w-44"
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") onStatusChange(undefined);
              else if (val === "active") onStatusChange(true);
              else if (val === "inactive") onStatusChange(false);
            }}
            value={
              isActive === undefined ? "all" : isActive ? "active" : "inactive"
            }
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          className="border-border bg-surface text-muted hover:bg-neutral-soft hover:text-foreground inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
          onClick={handleReset}
          type="button"
        >
          <X className="size-3.5" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
