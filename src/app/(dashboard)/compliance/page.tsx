import { CalendarDays, CheckCircle2 } from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";

const frameworks = [
  {
    name: "ISO/IEC 27001:2022",
    scope: "Toàn tổ chức",
    coverage: "81%",
    status: "Đang triển khai",
    tone: "info" as const,
  },
  {
    name: "NIST Cybersecurity Framework 2.0",
    scope: "Hạ tầng và SOC",
    coverage: "74%",
    status: "Đang triển khai",
    tone: "info" as const,
  },
  {
    name: "PCI DSS 4.0.1",
    scope: "Hệ thống thanh toán",
    coverage: "92%",
    status: "Đánh giá nội bộ",
    tone: "warning" as const,
  },
  {
    name: "Nghị định 13/2023/NĐ-CP",
    scope: "Dữ liệu cá nhân",
    coverage: "86%",
    status: "Đang duy trì",
    tone: "success" as const,
  },
] as const;

export default function CompliancePage() {
  return (
    <>
      <ProductPageHeader
        title="Tuân thủ"
        description="Theo dõi phạm vi áp dụng, mức bao phủ kiểm soát, bằng chứng và lịch đánh giá theo từng khung."
        primaryAction="Thêm khung tuân thủ"
      />
      <MetricStrip
        metrics={[
          {
            label: "Khung đang áp dụng",
            value: "4",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Yêu cầu được ánh xạ",
            value: "318",
            detail: "Trên 362 yêu cầu",
            tone: "neutral",
          },
          {
            label: "Khoảng trống",
            value: "29",
            detail: "Cần kế hoạch xử lý",
            tone: "warning",
          },
          {
            label: "Bằng chứng sắp hết hạn",
            value: "12",
            detail: "Trong 30 ngày",
            tone: "danger",
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((framework) => (
          <section
            className="border-border bg-surface rounded-xl border p-5"
            key={framework.name}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{framework.name}</h2>
                <p className="text-muted mt-1 text-sm">{framework.scope}</p>
              </div>
              <StatusBadge tone={framework.tone}>
                {framework.status}
              </StatusBadge>
            </div>
            <div className="border-border mt-6 flex items-end justify-between border-t pt-4">
              <div>
                <p className="text-muted text-xs">Mức bao phủ mẫu</p>
                <p className="text-brand mt-1 text-2xl font-semibold">
                  {framework.coverage}
                </p>
              </div>
              <button className="text-brand text-sm font-medium">
                Xem chi tiết
              </button>
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ProductPanel title="Mốc đánh giá sắp tới">
          <div className="space-y-4 p-5">
            <Milestone
              date="12/09"
              title="Rà soát phạm vi PCI DSS"
              owner="Pháp chế và Hạ tầng"
            />
            <Milestone
              date="21/09"
              title="Đánh giá nội bộ ISO 27001"
              owner="Kiểm toán nội bộ"
            />
            <Milestone
              date="05/10"
              title="Gia hạn bằng chứng dữ liệu cá nhân"
              owner="DPO"
            />
          </div>
        </ProductPanel>
        <ProductPanel title="Tình trạng bằng chứng">
          <div className="grid grid-cols-2 gap-4 p-5">
            <Evidence label="Hợp lệ" value="286" icon={<CheckCircle2 />} />
            <Evidence label="Sắp hết hạn" value="12" icon={<CalendarDays />} />
            <Evidence
              label="Chờ phê duyệt"
              value="18"
              icon={<CalendarDays />}
            />
            <Evidence label="Thiếu" value="9" icon={<CalendarDays />} />
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function Milestone({
  date,
  title,
  owner,
}: {
  date: string;
  title: string;
  owner: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="bg-brand-soft text-brand grid size-12 shrink-0 place-items-center rounded-lg text-sm font-semibold">
        {date}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted mt-1 text-sm">{owner}</p>
      </div>
    </div>
  );
}
function Evidence({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-soft rounded-lg p-4">
      <span className="text-brand [&>svg]:size-4">{icon}</span>
      <p className="mt-3 text-xl font-semibold">{value}</p>
      <p className="text-muted mt-1 text-xs">{label}</p>
    </div>
  );
}
