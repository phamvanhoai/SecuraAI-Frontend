import {
  ArrowUpRight,
  BrainCircuit,
  Monitor,
  ShieldAlert,
  Siren,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  DistributionDonut,
  RiskTrendChart,
} from "@/components/data-display/product-charts";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";

const alerts = [
  ["Đăng nhập bất thường từ IP lạ", "2 phút trước", "Cao"],
  ["Truy cập trái phép vào dữ liệu nhạy cảm", "15 phút trước", "Cao"],
  ["Tải xuống dữ liệu bất thường", "1 giờ trước", "Trung bình"],
  ["Thay đổi cấu hình hệ thống", "3 giờ trước", "Trung bình"],
] as const;

export default function DashboardPage() {
  return (
    <>
      <ProductPageHeader
        title="Dashboard tổng quan"
        description="Theo dõi nhanh tài sản, rủi ro, sự cố và mức độ tuân thủ của tổ chức."
      />
      <MetricStrip
        metrics={[
          {
            label: "Tổng tài sản",
            value: "1.248",
            detail: "Tăng 8,5% so với tháng trước",
            tone: "brand",
          },
          {
            label: "Rủi ro đang mở",
            value: "156",
            detail: "23 rủi ro rất cao",
            tone: "danger",
          },
          {
            label: "Sự cố đang xử lý",
            value: "23",
            detail: "Giảm 4,2%",
            tone: "warning",
          },
          {
            label: "Cảnh báo AI mới",
            value: "12",
            detail: "Trong 24 giờ",
            tone: "brand",
          },
          {
            label: "Tỷ lệ tuân thủ",
            value: "85%",
            detail: "Tăng 5,6%",
            tone: "brand",
          },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.75fr_0.95fr]">
        <ProductPanel title="Xu hướng rủi ro theo thời gian">
          <div className="text-muted flex flex-wrap gap-4 px-5 pt-4 text-xs">
            <span className="text-danger">● Rất cao</span>
            <span className="text-warning">● Cao</span>
            <span>● Trung bình</span>
            <span className="text-success">● Thấp</span>
          </div>
          <div className="px-3 pb-3">
            <RiskTrendChart />
          </div>
        </ProductPanel>
        <ProductPanel title="Phân bố rủi ro">
          <div className="p-3">
            <DistributionDonut
              total="156"
              items={[
                { label: "Rất cao", value: "23" },
                { label: "Cao", value: "45" },
                { label: "Trung bình", value: "58" },
                { label: "Thấp", value: "30" },
              ]}
            />
            <div className="text-muted grid grid-cols-2 gap-2 px-2 pb-2 text-xs">
              <span>Rất cao: 23</span>
              <span>Cao: 45</span>
              <span>Trung bình: 58</span>
              <span>Thấp: 30</span>
            </div>
          </div>
        </ProductPanel>
        <ProductPanel title="Cảnh báo AI mới nhất">
          <div className="divide-border divide-y">
            {alerts.map(([title, time, level], index) => (
              <div className="flex gap-3 p-4" key={title}>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${index < 2 ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}
                >
                  {index === 0 ? (
                    <BrainCircuit className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5 font-medium">{title}</p>
                  <p className="text-muted mt-1 text-xs">{time}</p>
                </div>
                <StatusBadge tone={index < 2 ? "danger" : "warning"}>
                  {level}
                </StatusBadge>
              </div>
            ))}
          </div>
          <Link
            className="text-brand flex items-center gap-2 px-4 py-3 text-sm font-medium"
            href="/admin/alerts"
          >
            Xem tất cả <ArrowUpRight className="size-4" />
          </Link>
        </ProductPanel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.15fr_0.9fr]">
        <ProductPanel title="Tài sản có rủi ro cao">
          <div className="divide-border divide-y">
            {[
              ["Database Production", "Rất cao"],
              ["File Server 01", "Cao"],
              ["Web Server 02", "Cao"],
              ["VPN Gateway", "Trung bình"],
            ].map(([name, level], index) => (
              <div className="flex items-center gap-3 px-4 py-3" key={name}>
                <Monitor className="text-muted size-4" />
                <span className="flex-1 text-sm">{name}</span>
                <StatusBadge tone={index === 0 ? "danger" : "warning"}>
                  {level}
                </StatusBadge>
              </div>
            ))}
          </div>
        </ProductPanel>
        <ProductPanel title="Sự cố gần đây">
          <div className="divide-border divide-y">
            {[
              [
                "INC-2024-0056",
                "Ransomware tấn công file server",
                "Đang xử lý",
              ],
              ["INC-2024-0055", "Website không truy cập được", "Đang xử lý"],
              ["INC-2024-0054", "Rò rỉ dữ liệu khách hàng", "Chờ xử lý"],
              ["INC-2024-0053", "Lỗi cấu hình tường lửa", "Đã đóng"],
            ].map(([code, title, status], index) => (
              <div className="flex items-center gap-3 px-4 py-3" key={code}>
                <Siren className="text-muted size-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{code}</p>
                  <p className="text-muted text-xs">{title}</p>
                </div>
                <StatusBadge
                  tone={
                    index === 3 ? "success" : index === 2 ? "warning" : "info"
                  }
                >
                  {status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </ProductPanel>
        <ProductPanel title="Đào tạo và nhận thức">
          <div className="p-5">
            <div className="border-brand-soft mx-auto grid size-36 place-items-center rounded-full border-[16px] text-center">
              <div>
                <strong className="text-brand block text-3xl">72%</strong>
                <span className="text-muted text-xs">Hoàn thành</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2">
                <Target className="size-4" />
                Đã hoàn thành
              </span>
              <strong>215 học viên</strong>
            </div>
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
