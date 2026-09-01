import {
  Database,
  Laptop,
  MoreHorizontal,
  Server,
  Smartphone,
} from "lucide-react";
import {
  MetricStrip,
  PaginationBar,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const assets = [
  [
    <Asset
      key="a1"
      icon={<Server />}
      name="Production API Cluster"
      code="AST-SRV-0042"
    />,
    "Máy chủ",
    "Nền tảng số",
    "Rất cao",
    <StatusBadge tone="success" key="s1">
      Đang vận hành
    </StatusBadge>,
    "02/09/2026",
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    <Asset
      key="a2"
      icon={<Database />}
      name="Customer Data Warehouse"
      code="AST-DB-0018"
    />,
    "Cơ sở dữ liệu",
    "Phân tích dữ liệu",
    "Rất cao",
    <StatusBadge tone="success" key="s2">
      Đang vận hành
    </StatusBadge>,
    "28/08/2026",
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    <Asset
      key="a3"
      icon={<Laptop />}
      name="Finance Workstations"
      code="AST-END-0124"
    />,
    "Thiết bị đầu cuối",
    "Tài chính",
    "Cao",
    <StatusBadge tone="warning" key="s3">
      Cần rà soát
    </StatusBadge>,
    "16/08/2026",
    <MoreHorizontal className="size-4" key="m3" />,
  ],
  [
    <Asset
      key="a4"
      icon={<Smartphone />}
      name="Executive Mobile Fleet"
      code="AST-MOB-0031"
    />,
    "Thiết bị di động",
    "Ban điều hành",
    "Cao",
    <StatusBadge tone="success" key="s4">
      Đang vận hành
    </StatusBadge>,
    "11/08/2026",
    <MoreHorizontal className="size-4" key="m4" />,
  ],
] as const;
function Asset({
  icon,
  name,
  code,
}: {
  icon: React.ReactNode;
  name: string;
  code: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-neutral-soft text-brand grid size-9 place-items-center rounded-lg [&>svg]:size-4">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{name}</span>
        <span className="text-muted text-xs">{code}</span>
      </span>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <>
      <ProductPageHeader
        title="Quản lý tài sản"
        description="Duy trì danh mục tài sản thông tin, chủ sở hữu, mức độ quan trọng và vòng đời."
        primaryAction="Thêm tài sản"
        secondaryAction="Nhập danh sách"
      />
      <MetricStrip
        metrics={[
          {
            label: "Tổng tài sản",
            value: "1.284",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Quan trọng cao",
            value: "186",
            detail: "14,5% danh mục",
            tone: "danger",
          },
          {
            label: "Cần rà soát",
            value: "47",
            detail: "Quá hạn đánh giá",
            tone: "warning",
          },
          {
            label: "Ngừng sử dụng",
            value: "29",
            detail: "Chờ xử lý",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel title="Danh mục tài sản">
        <ProductToolbar
          searchPlaceholder="Tìm tên hoặc mã tài sản"
          filters={["Loại tài sản", "Đơn vị sở hữu", "Mức quan trọng"]}
        />
        <StaticTable
          caption="Danh mục tài sản mẫu"
          headers={[
            "Tài sản",
            "Loại",
            "Đơn vị sở hữu",
            "Mức quan trọng",
            "Trạng thái",
            "Rà soát gần nhất",
            "",
          ]}
          rows={assets}
        />
        <PaginationBar label="Hiển thị 1-4 trong 1.284 tài sản mẫu" />
      </ProductPanel>
    </>
  );
}
