import {
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Upload,
} from "lucide-react";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const files = [
  [
    <FileCell
      key="f1"
      icon={<FileText />}
      name="ISO27001_Internal_Audit_2026.pdf"
      meta="PDF, 4,8 MB"
    />,
    "Bằng chứng tuân thủ",
    "Lê Hoàng Phương",
    "01/09/2026",
    <StatusBadge tone="success" key="s1">
      Đã kiểm tra
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m1" />,
  ],
  [
    <FileCell
      key="f2"
      icon={<FileSpreadsheet />}
      name="Critical_Assets_September.xlsx"
      meta="XLSX, 1,2 MB"
    />,
    "Nhập tài sản",
    "Trần Quốc Huy",
    "01/09/2026",
    <StatusBadge tone="warning" key="s2">
      Đang xử lý
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m2" />,
  ],
  [
    <FileCell
      key="f3"
      icon={<FileArchive />}
      name="INC-2026-0083_Evidence.zip"
      meta="ZIP, 18,6 MB"
    />,
    "Bằng chứng sự cố",
    "Nguyễn Minh Anh",
    "31/08/2026",
    <StatusBadge tone="success" key="s3">
      Đã quét
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m3" />,
  ],
  [
    <FileCell
      key="f4"
      icon={<FileCheck2 />}
      name="Vendor_Security_Assessment.pdf"
      meta="PDF, 2,4 MB"
    />,
    "Đánh giá nhà cung cấp",
    "Võ Thanh Tâm",
    "29/08/2026",
    <StatusBadge tone="success" key="s4">
      Đã kiểm tra
    </StatusBadge>,
    <MoreHorizontal className="size-4" key="m4" />,
  ],
] as const;
function FileCell({
  icon,
  name,
  meta,
}: {
  icon: React.ReactNode;
  name: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-soft text-brand grid size-9 place-items-center rounded-lg [&>svg]:size-4">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{name}</span>
        <span className="text-muted text-xs">{meta}</span>
      </span>
    </div>
  );
}

export default function FilesPage() {
  return (
    <>
      <ProductPageHeader
        title="Quản lý tệp"
        description="Lưu trữ bằng chứng, tài liệu báo cáo và theo dõi các tác vụ nhập dữ liệu."
        primaryAction="Tải tệp lên"
      />
      <MetricStrip
        metrics={[
          {
            label: "Tổng tệp",
            value: "3.482",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Dung lượng",
            value: "18,4 GB",
            detail: "Trên 50 GB",
            tone: "neutral",
          },
          {
            label: "Đang xử lý",
            value: "3",
            detail: "Tác vụ nhập dữ liệu",
            tone: "warning",
          },
          {
            label: "Bị từ chối",
            value: "2",
            detail: "Không đạt chính sách",
            tone: "danger",
          },
        ]}
      />
      <ProductPanel title="Kho tệp">
        <ProductToolbar
          searchPlaceholder="Tìm tên tệp hoặc người tải lên"
          filters={["Loại tệp", "Danh mục", "Trạng thái"]}
        />
        <div className="border-border bg-background m-4 flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
          <Upload className="text-brand size-6" />
          <p className="mt-2 text-sm font-medium">
            Kéo tệp vào đây hoặc chọn tải lên
          </p>
          <p className="text-muted mt-1 text-xs">
            Khu vực minh họa, chưa xử lý tệp thật
          </p>
        </div>
        <StaticTable
          caption="Danh sách tệp mẫu"
          headers={[
            "Tên tệp",
            "Danh mục",
            "Người tải lên",
            "Ngày tải",
            "Trạng thái",
            "",
          ]}
          rows={files}
        />
      </ProductPanel>
    </>
  );
}
