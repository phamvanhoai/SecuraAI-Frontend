import {
  ArrowUpRight,
  CalendarClock,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";

export default function DashboardPage() {
  return (
    <>
      <ProductPageHeader
        title="Tổng quan an toàn thông tin"
        description="Không gian điều hành tập trung cho rủi ro, sự cố, kiểm soát và tuân thủ."
      />
      <MetricStrip
        metrics={[
          {
            label: "Rủi ro đang mở",
            value: "73",
            detail: "9 ở mức rất cao",
            tone: "danger",
          },
          {
            label: "Sự cố đang xử lý",
            value: "14",
            detail: "2 sự cố nghiêm trọng",
            tone: "warning",
          },
          {
            label: "Kiểm soát hiệu lực",
            value: "121 / 146",
            detail: "82,9% thư viện",
            tone: "brand",
          },
          {
            label: "Bằng chứng sắp hết hạn",
            value: "12",
            detail: "Trong 30 ngày",
            tone: "warning",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ProductPanel
          title="Ưu tiên cần xử lý"
          description="Các mục mẫu được sắp theo mức độ ảnh hưởng và thời hạn."
        >
          <div className="divide-border divide-y">
            <Priority
              icon={<ShieldAlert />}
              title="Rò rỉ dữ liệu qua tài khoản đặc quyền"
              meta="RSK-2026-041, quá hạn 2 ngày"
              tone="danger"
            />
            <Priority
              icon={<TriangleAlert />}
              title="Đăng nhập bất thường vào tài khoản quản trị"
              meta="INC-2026-0087, đang điều tra"
              tone="warning"
            />
            <Priority
              icon={<CalendarClock />}
              title="12 bằng chứng PCI DSS sắp hết hạn"
              meta="Hạn gần nhất 12/09/2026"
              tone="info"
            />
          </div>
          <div className="border-border border-t px-5 py-4">
            <button className="text-brand inline-flex items-center gap-2 text-sm font-medium">
              Xem trung tâm tác vụ
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </ProductPanel>
        <ProductPanel
          title="Phân bố rủi ro"
          description="Số lượng đánh giá theo mức rủi ro mẫu."
        >
          <div className="grid grid-cols-2 gap-3 p-5">
            <RiskTile
              label="Rất cao"
              value="9"
              className="bg-danger-soft text-danger"
            />
            <RiskTile
              label="Cao"
              value="21"
              className="bg-warning-soft text-warning"
            />
            <RiskTile
              label="Trung bình"
              value="28"
              className="bg-info-soft text-info"
            />
            <RiskTile
              label="Thấp"
              value="15"
              className="bg-neutral-soft text-muted"
            />
          </div>
        </ProductPanel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ProductPanel title="Tiến độ tuân thủ">
          <div className="space-y-5 p-5">
            <Compliance
              name="ISO/IEC 27001:2022"
              value="81%"
              state="Đang triển khai"
            />
            <Compliance
              name="NIST CSF 2.0"
              value="74%"
              state="Đang triển khai"
            />
            <Compliance
              name="PCI DSS 4.0.1"
              value="92%"
              state="Đánh giá nội bộ"
            />
          </div>
        </ProductPanel>
        <ProductPanel title="Sự cố gần đây">
          <div className="divide-border divide-y">
            <Incident
              code="INC-2026-0087"
              title="Đăng nhập quản trị bất thường"
              level="Nghiêm trọng"
              tone="danger"
            />
            <Incident
              code="INC-2026-0086"
              title="Malware trên máy trạm tài chính"
              level="Cao"
              tone="warning"
            />
            <Incident
              code="INC-2026-0083"
              title="Email giả mạo thanh toán"
              level="Đã xử lý"
              tone="success"
            />
          </div>
        </ProductPanel>
      </div>
    </>
  );
}

function Priority({
  icon,
  title,
  meta,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tone: "danger" | "warning" | "info";
}) {
  const color =
    tone === "danger"
      ? "bg-danger-soft text-danger"
      : tone === "warning"
        ? "bg-warning-soft text-warning"
        : "bg-info-soft text-info";
  return (
    <div className="flex items-start gap-4 p-5">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg [&>svg]:size-5 ${color}`}
      >
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted mt-1 text-sm">{meta}</p>
      </div>
    </div>
  );
}
function RiskTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
  );
}
function Compliance({
  name,
  value,
  state,
}: {
  name: string;
  value: string;
  state: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-muted mt-1 text-xs">{state}</p>
      </div>
      <span className="text-brand text-xl font-semibold">{value}</span>
    </div>
  );
}
function Incident({
  code,
  title,
  level,
  tone,
}: {
  code: string;
  title: string;
  level: string;
  tone: "danger" | "warning" | "success";
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted mt-1 text-xs">{code}</p>
      </div>
      <StatusBadge tone={tone}>{level}</StatusBadge>
    </div>
  );
}
