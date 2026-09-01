import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const risks = [
  [
    <Risk
      key="r1"
      code="RSK-2026-041"
      title="Rò rỉ dữ liệu qua tài khoản đặc quyền"
    />,
    "Customer Data Warehouse",
    <Score key="c1" value="20" tone="danger" />,
    "Trần Quốc Huy",
    <StatusBadge tone="danger" key="s1">
      Quá hạn xử lý
    </StatusBadge>,
    "05/09/2026",
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    <Risk
      key="r2"
      code="RSK-2026-038"
      title="Gián đoạn dịch vụ API sản xuất"
    />,
    "Production API Cluster",
    <Score key="c2" value="16" tone="danger" />,
    "Nguyễn Minh Anh",
    <StatusBadge tone="warning" key="s2">
      Đang xử lý
    </StatusBadge>,
    "12/09/2026",
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    <Risk
      key="r3"
      code="RSK-2026-032"
      title="Thiết bị đầu cuối không cập nhật bản vá"
    />,
    "Finance Workstations",
    <Score key="c3" value="12" tone="warning" />,
    "Lê Hoàng Phương",
    <StatusBadge tone="info" key="s3">
      Đã phê duyệt
    </StatusBadge>,
    "18/09/2026",
    <MoreHorizontal className="size-4" key="m3" />,
  ],
  [
    <Risk
      key="r4"
      code="RSK-2026-027"
      title="Nhà cung cấp chậm thông báo sự cố"
    />,
    "Dịch vụ thanh toán",
    <Score key="c4" value="8" tone="info" />,
    "Võ Thanh Tâm",
    <StatusBadge tone="success" key="s4">
      Đang theo dõi
    </StatusBadge>,
    "30/09/2026",
    <MoreHorizontal className="size-4" key="m4" />,
  ],
] as const;
function Risk({ code, title }: { code: string; title: string }) {
  return (
    <span>
      <span className="block font-medium">{title}</span>
      <span className="text-muted text-xs">{code}</span>
    </span>
  );
}
function Score({
  value,
  tone,
}: {
  value: string;
  tone: "danger" | "warning" | "info";
}) {
  return (
    <span
      className={`inline-flex size-9 items-center justify-center rounded-lg font-semibold ${tone === "danger" ? "bg-danger-soft text-danger" : tone === "warning" ? "bg-warning-soft text-warning" : "bg-info-soft text-info"}`}
    >
      {value}
    </span>
  );
}

export default function RisksPage() {
  return (
    <>
      <ProductPageHeader
        title="Đánh giá rủi ro"
        description="Theo dõi nhận diện, phân tích, phê duyệt và kế hoạch xử lý rủi ro theo tài sản."
        primaryAction="Tạo đánh giá"
        secondaryAction="Xuất sổ rủi ro"
      />
      <MetricStrip
        metrics={[
          {
            label: "Rủi ro mở",
            value: "73",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Mức rất cao",
            value: "9",
            detail: "Cần ưu tiên",
            tone: "danger",
          },
          {
            label: "Kế hoạch quá hạn",
            value: "7",
            detail: "Cần chuyển cấp",
            tone: "warning",
          },
          {
            label: "Chấp nhận rủi ro",
            value: "18",
            detail: "Trong kỳ hiện tại",
            tone: "neutral",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.65fr]">
        <ProductPanel title="Sổ đăng ký rủi ro">
          <ProductToolbar
            searchPlaceholder="Tìm mã hoặc mô tả rủi ro"
            filters={["Mức rủi ro", "Chủ sở hữu", "Trạng thái"]}
          />
          <StaticTable
            caption="Sổ rủi ro mẫu"
            headers={[
              "Rủi ro",
              "Đối tượng",
              "Điểm",
              "Chủ sở hữu",
              "Trạng thái",
              "Hạn xử lý",
              "",
            ]}
            rows={risks}
          />
        </ProductPanel>
        <ProductPanel title="Phân bố mức rủi ro">
          <div className="space-y-3 p-5">
            <RiskCount label="Rất cao" count="9" tone="danger" />
            <RiskCount label="Cao" count="21" tone="warning" />
            <RiskCount label="Trung bình" count="28" tone="info" />
            <RiskCount label="Thấp" count="15" tone="neutral" />
            <button className="text-brand mt-3 inline-flex items-center gap-2 text-sm font-medium">
              Xem ma trận rủi ro
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function RiskCount({
  label,
  count,
  tone,
}: {
  label: string;
  count: string;
  tone: "danger" | "warning" | "info" | "neutral";
}) {
  return (
    <div className="bg-neutral-soft flex items-center justify-between rounded-lg p-3">
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <strong>{count}</strong>
    </div>
  );
}
