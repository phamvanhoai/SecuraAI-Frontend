import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
export default function ForbiddenPage() {
  return (
    <div className="space-y-4">
      <EmptyState
        title="403 — Không có quyền truy cập"
        description="Tài khoản của bạn không được phép xem nội dung này."
      />
      <Link
        className="text-brand focus-visible:outline-brand inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium underline focus-visible:outline-2"
        href="/profile"
      >
        Về hồ sơ tài khoản
      </Link>
    </div>
  );
}
