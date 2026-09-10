import { Suspense } from "react";
import { AssetsShell } from "@/features/assets";

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted py-10 text-center">
          Đang tải danh sách tài sản…
        </p>
      }
    >
      <AssetsShell />
    </Suspense>
  );
}
