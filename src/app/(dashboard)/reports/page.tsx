import {
  BarChart3,
  CalendarClock,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const reports = [
  [
    <Report
      key="r1"
      icon={<BarChart3 />}
      title="Tổng quan rủi ro tháng"
      type="Dashboard"
    />,
    "Ban điều hành",
    "Hàng tháng",
    "01/09/2026",
    <StatusBadge tone="success" key="s1">
      Sẵn sàng
    </StatusBadge>,
  ],
  [
    <Report
      key="r2"
      icon={<FileText />}
      title="Báo cáo tuân thủ ISO 27001"
      type="PDF"
    />,
    "Kiểm toán nội bộ",
    "Theo quý",
    "28/08/2026",
    <StatusBadge tone="success" key="s2">
      Sẵn sàng
    </StatusBadge>,
  ],
  [
    <Report
      key="r3"
      icon={<FileSpreadsheet />}
      title="Danh mục tài sản trọng yếu"
      type="Excel"
    />,
    "An toàn thông tin",
    "Theo tuần",
    "26/08/2026",
    <StatusBadge tone="warning" key="s3">
      Đang tạo
    </StatusBadge>,
  ],
] as const;
function Report({
  icon,
  title,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  type: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-soft text-brand grid size-9 place-items-center rounded-lg [&>svg]:size-4">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-muted text-xs">{type}</span>
      </span>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <>
      <ProductPageHeader
        title="Báo cáo"
        description="Tổng hợp báo cáo điều hành, tuân thủ và vận hành theo lịch hoặc theo yêu cầu."
        primaryAction="Tạo báo cáo"
      />
      <MetricStrip
        metrics={[
          {
            label: "Mẫu báo cáo",
            value: "18",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Lịch đang chạy",
            value: "7",
            detail: "Theo tuần và tháng",
            tone: "neutral",
          },
          {
            label: "Đã tạo tháng này",
            value: "34",
            detail: "PDF và Excel",
            tone: "brand",
          },
          {
            label: "Tạo thất bại",
            value: "1",
            detail: "Cần chạy lại",
            tone: "danger",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
        <ProductPanel title="Báo cáo gần đây">
          <StaticTable
            caption="Danh sách báo cáo mẫu"
            headers={[
              "Báo cáo",
              "Đối tượng",
              "Tần suất",
              "Cập nhật",
              "Trạng thái",
            ]}
            rows={reports}
          />
        </ProductPanel>
        <ProductPanel title="Lịch sắp chạy">
          <div className="space-y-4 p-5">
            <Schedule date="02/09, 07:00" title="Tài sản trọng yếu" />
            <Schedule date="05/09, 08:00" title="Tình trạng xử lý rủi ro" />
            <Schedule date="01/10, 06:30" title="Tổng quan tuân thủ quý" />
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function Schedule({ date, title }: { date: string; title: string }) {
  return (
    <div className="flex gap-3">
      <CalendarClock className="text-brand mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted mt-1 text-xs">{date}</p>
      </div>
    </div>
  );
}
