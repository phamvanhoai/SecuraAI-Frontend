import { MoreHorizontal } from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const rows = [
  [
    "A.5.15",
    "Kiểm soát truy cập",
    "ISO/IEC 27001:2022",
    "An toàn thông tin",
    <StatusBadge tone="success" key="s1">
      Hiệu lực
    </StatusBadge>,
    "30/08/2026",
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    "A.8.8",
    "Quản lý lỗ hổng kỹ thuật",
    "ISO/IEC 27001:2022",
    "Hạ tầng",
    <StatusBadge tone="warning" key="s2">
      Cần cải thiện
    </StatusBadge>,
    "26/08/2026",
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    "PR.AA-01",
    "Danh tính và thông tin xác thực",
    "NIST CSF 2.0",
    "An toàn thông tin",
    <StatusBadge tone="success" key="s3">
      Hiệu lực
    </StatusBadge>,
    "21/08/2026",
    <MoreHorizontal className="size-4" key="m3" />,
  ],
  [
    "DE.CM-09",
    "Giám sát hoạt động mạng",
    "NIST CSF 2.0",
    "SOC",
    <StatusBadge tone="info" key="s4">
      Đang đánh giá
    </StatusBadge>,
    "18/08/2026",
    <MoreHorizontal className="size-4" key="m4" />,
  ],
] as const;

export default function ControlsPage() {
  return (
    <>
      <ProductPageHeader
        title="Thư viện kiểm soát"
        description="Quản lý các kiểm soát, chủ sở hữu, lịch đánh giá và bằng chứng thực thi."
        primaryAction="Thêm kiểm soát"
        secondaryAction="Nhập thư viện"
      />
      <MetricStrip
        metrics={[
          {
            label: "Tổng kiểm soát",
            value: "146",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Đang hiệu lực",
            value: "121",
            detail: "82,9% thư viện",
            tone: "brand",
          },
          {
            label: "Cần cải thiện",
            value: "17",
            detail: "Có phát hiện mở",
            tone: "warning",
          },
          {
            label: "Chưa đánh giá",
            value: "8",
            detail: "Trong kỳ hiện tại",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel title="Danh mục kiểm soát">
        <ProductToolbar
          searchPlaceholder="Tìm mã hoặc tên kiểm soát"
          filters={["Khung", "Chủ sở hữu", "Hiệu lực"]}
        />
        <StaticTable
          caption="Danh mục kiểm soát mẫu"
          headers={[
            "Mã",
            "Kiểm soát",
            "Khung",
            "Chủ sở hữu",
            "Hiệu lực",
            "Đánh giá gần nhất",
            "",
          ]}
          rows={rows}
        />
      </ProductPanel>
    </>
  );
}
