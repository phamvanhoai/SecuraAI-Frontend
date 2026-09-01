import { Check, MoreHorizontal } from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const roleRows = [
  [
    "Security Administrator",
    "SECURITY_ADMIN",
    "Quản trị toàn bộ cấu hình bảo mật",
    "8",
    "42 / 42",
    <StatusBadge tone="success" key="r1">
      Hệ thống
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    "Risk Manager",
    "RISK_MANAGER",
    "Quản lý đánh giá và xử lý rủi ro",
    "14",
    "18 / 42",
    <StatusBadge tone="info" key="r2">
      Tùy chỉnh
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    "Internal Auditor",
    "INTERNAL_AUDITOR",
    "Rà soát bằng chứng và nhật ký",
    "6",
    "12 / 42",
    <StatusBadge tone="info" key="r3">
      Tùy chỉnh
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m3" />,
  ],
  [
    "Asset Owner",
    "ASSET_OWNER",
    "Duy trì tài sản thuộc phạm vi phụ trách",
    "37",
    "7 / 42",
    <StatusBadge tone="info" key="r4">
      Tùy chỉnh
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m4" />,
  ],
] as const;

export default function RolesPage() {
  return (
    <>
      <ProductPageHeader
        title="Vai trò và quyền"
        description="Xác định phạm vi truy cập theo nguyên tắc quyền tối thiểu và phân tách nhiệm vụ."
        primaryAction="Tạo vai trò"
      />
      <MetricStrip
        metrics={[
          {
            label: "Vai trò",
            value: "12",
            detail: "4 vai trò hệ thống",
            tone: "brand",
          },
          {
            label: "Quyền truy cập",
            value: "42",
            detail: "Theo module",
            tone: "neutral",
          },
          {
            label: "Người dùng đã gán",
            value: "244",
            detail: "4 chưa có vai trò",
            tone: "warning",
          },
          {
            label: "Xung đột SoD",
            value: "3",
            detail: "Cần rà soát",
            tone: "danger",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <ProductPanel title="Danh sách vai trò">
          <StaticTable
            caption="Danh sách vai trò mẫu"
            headers={[
              "Vai trò",
              "Mã",
              "Mô tả",
              "Người dùng",
              "Quyền",
              "Loại",
              "",
            ]}
            rows={roleRows}
          />
        </ProductPanel>
        <ProductPanel
          title="Kiểm tra phân tách nhiệm vụ"
          description="Các kết hợp quyền cần được phê duyệt độc lập."
        >
          <div className="space-y-4 p-5">
            <Conflict
              title="Quản trị người dùng và kiểm toán"
              owners="2 người dùng"
            />
            <Conflict title="Tạo và phê duyệt rủi ro" owners="1 người dùng" />
            <div className="bg-success-soft text-success flex items-center gap-3 rounded-lg p-3 text-sm">
              <Check className="size-4" />9 vai trò không có xung đột
            </div>
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function Conflict({ title, owners }: { title: string; owners: string }) {
  return (
    <div className="border-danger/20 bg-danger-soft rounded-lg border p-4">
      <p className="text-danger font-medium">{title}</p>
      <p className="text-danger/80 mt-1 text-sm">{owners} cần rà soát</p>
    </div>
  );
}
