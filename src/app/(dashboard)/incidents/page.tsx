import { Clock3, MoreHorizontal } from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const incidents = [
  [
    <Incident
      key="i1"
      code="INC-2026-0087"
      title="Phát hiện đăng nhập bất thường vào tài khoản quản trị"
    />,
    <StatusBadge tone="danger" key="p1">
      Nghiêm trọng
    </StatusBadge>,
    "SOC",
    "Nguyễn Minh Anh",
    <StatusBadge tone="warning" key="s1">
      Đang điều tra
    </StatusBadge>,
    "18 phút trước",
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    <Incident
      key="i2"
      code="INC-2026-0086"
      title="Malware bị chặn trên máy trạm phòng tài chính"
    />,
    <StatusBadge tone="warning" key="p2">
      Cao
    </StatusBadge>,
    "Endpoint",
    "Trần Quốc Huy",
    <StatusBadge tone="info" key="s2">
      Đã cô lập
    </StatusBadge>,
    "2 giờ trước",
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    <Incident
      key="i3"
      code="INC-2026-0083"
      title="Email giả mạo yêu cầu thay đổi tài khoản thanh toán"
    />,
    <StatusBadge tone="warning" key="p3">
      Cao
    </StatusBadge>,
    "Người dùng",
    "Lê Hoàng Phương",
    <StatusBadge tone="success" key="s3">
      Đã xử lý
    </StatusBadge>,
    "Hôm qua",
    <MoreHorizontal className="size-4" key="m3" />,
  ],
] as const;
function Incident({ code, title }: { code: string; title: string }) {
  return (
    <span>
      <span className="block max-w-md font-medium">{title}</span>
      <span className="text-muted text-xs">{code}</span>
    </span>
  );
}

export default function IncidentsPage() {
  return (
    <>
      <ProductPageHeader
        title="Quản lý sự cố"
        description="Tiếp nhận, phân loại, phân công và theo dõi toàn bộ vòng đời sự cố an toàn thông tin."
        primaryAction="Báo cáo sự cố"
        secondaryAction="Xuất báo cáo"
      />
      <MetricStrip
        metrics={[
          {
            label: "Sự cố đang mở",
            value: "14",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Nghiêm trọng",
            value: "2",
            detail: "Đang được ưu tiên",
            tone: "danger",
          },
          {
            label: "SLA có nguy cơ",
            value: "4",
            detail: "Còn dưới 2 giờ",
            tone: "warning",
          },
          {
            label: "Đóng trong tháng",
            value: "31",
            detail: "Thời gian xử lý 6,4 giờ",
            tone: "neutral",
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.7fr]">
        <ProductPanel title="Danh sách sự cố">
          <ProductToolbar
            searchPlaceholder="Tìm mã hoặc nội dung sự cố"
            filters={["Mức độ", "Nguồn", "Trạng thái"]}
          />
          <StaticTable
            caption="Danh sách sự cố mẫu"
            headers={[
              "Sự cố",
              "Mức độ",
              "Nguồn",
              "Người xử lý",
              "Trạng thái",
              "Cập nhật",
              "",
            ]}
            rows={incidents}
          />
        </ProductPanel>
        <ProductPanel title="Hoạt động gần đây">
          <div className="space-y-5 p-5">
            <Activity time="09:42" text="Đã cô lập thiết bị FIN-LT-042" />
            <Activity time="09:18" text="Phân công INC-2026-0087 cho đội SOC" />
            <Activity time="08:55" text="Tiếp nhận bằng chứng email giả mạo" />
            <Activity time="08:31" text="Đóng sự cố INC-2026-0081" />
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function Activity({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex gap-3">
      <Clock3 className="text-brand mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-sm font-medium">{text}</p>
        <p className="text-muted mt-1 text-xs">{time}, dữ liệu mẫu</p>
      </div>
    </div>
  );
}
