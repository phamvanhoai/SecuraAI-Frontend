"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/authentication-account";
import { WorkflowManagementView } from "@/features/workflows";

export default function WorkflowDefinitionsPage() {
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const canRead = permissions.includes("workflows.read");

  if (session.isPending) {
    return (
      <div
        aria-label="Đang tải thông tin người dùng"
        className="bg-neutral-soft min-h-[400px] animate-pulse rounded-xl"
      />
    );
  }

  if (!canRead) {
    return (
      <EmptyState
        description="Bạn không có quyền truy cập vào danh mục quy trình phê duyệt (workflows.read)."
        title="Không có quyền truy cập"
      />
    );
  }

  return <WorkflowManagementView />;
}
