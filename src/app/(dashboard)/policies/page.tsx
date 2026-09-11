"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import { PolicyDraftsManager } from "@/features/policies";

export default function Page() {
  const session = useSessionUser();
  const canCreateDrafts =
    session.data?.permissions.includes("policies.create") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Đang tải chức năng chính sách"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }

  if (canCreateDrafts) return <PolicyDraftsManager />;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Phê duyệt và xuất bản chính sách"
        description="Xem xét các bản nháp do Chuyên viên ATTT gửi và phát hành phiên bản chính thức."
      />
      <EmptyState
        title="Chưa triển khai"
        description="Giao diện phê duyệt và xuất bản sẽ được kết nối trong chức năng Publish Official Policy Version."
      />
    </div>
  );
}
