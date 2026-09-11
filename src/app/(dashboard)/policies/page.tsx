"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import { PolicyPublicationManager } from "@/features/policies";

export default function Page() {
  const session = useSessionUser();
  const canPublish =
    session.data?.permissions.includes("policies.publish") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Đang tải chức năng chính sách"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }

  if (canPublish) return <PolicyPublicationManager />;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        description="Chức năng được giới hạn cho tài khoản có quyền xuất bản chính sách."
        showSampleNotice={false}
        title="Phê duyệt và xuất bản chính sách"
      />
      <EmptyState
        description="Tài khoản hiện tại không có quyền policies.publish."
        title="Bạn không có quyền xuất bản chính sách"
      />
    </div>
  );
}
