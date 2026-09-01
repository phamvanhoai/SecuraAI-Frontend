import { Eye, ShieldCheck } from "lucide-react";
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
    "AUD-2026-0041",
    "Cập nhật quyền Risk Manager",
    "Access control",
    "Nguyễn Minh Anh",
    "01/09/2026 15:42",
    <StatusBadge tone="success" key="s1">
      Thành công
    </StatusBadge>,
    <Eye className="size-4" key="e1" />,
  ],
  [
    "AUD-2026-0040",
    "Đăng xuất phiên người dùng",
    "Authentication",
    "Trần Quốc Huy",
    "01/09/2026 15:18",
    <StatusBadge tone="success" key="s2">
      Thành công
    </StatusBadge>,
    <Eye className="size-4" key="e2" />,
  ],
  [
    "AUD-2026-0039",
    "Tải xuống bằng chứng PCI",
    "File management",
    "Lê Hoàng Phương",
    "01/09/2026 14:57",
    <StatusBadge tone="success" key="s3">
      Thành công
    </StatusBadge>,
    <Eye className="size-4" key="e3" />,
  ],
  [
    "AUD-2026-0038",
    "Thử đăng nhập thất bại",
    "Authentication",
    "203.0.113.42",
    "01/09/2026 14:31",
    <StatusBadge tone="danger" key="s4">
      Bị từ chối
    </StatusBadge>,
    <Eye className="size-4" key="e4" />,
  ],
] as const;

export default function AuditsPage() {
  return (
    <>
      <ProductPageHeader
        title="Nhật ký kiểm toán"
        description="Tra cứu hoạt động bảo mật, thay đổi cấu hình và sự kiện truy cập phục vụ điều tra."
        secondaryAction="Xuất nhật ký"
      />
      <MetricStrip
        metrics={[
          {
            label: "Sự kiện hôm nay",
            value: "1.842",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Thay đổi nhạy cảm",
            value: "23",
            detail: "Đã ghi nhận",
            tone: "warning",
          },
          {
            label: "Truy cập bị từ chối",
            value: "17",
            detail: "Từ 6 địa chỉ IP",
            tone: "danger",
          },
          {
            label: "Thời gian lưu giữ",
            value: "365 ngày",
            detail: "Theo chính sách",
            tone: "neutral",
          },
        ]}
      />
      <div className="border-success/25 bg-success-soft text-success mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Nhật ký được bảo vệ</p>
          <p className="mt-1 leading-5">
            Giao diện mẫu mô tả audit trail bất biến. Việc bảo vệ thực tế do
            backend và database thực thi.
          </p>
        </div>
      </div>
      <ProductPanel title="Dòng sự kiện">
        <ProductToolbar
          searchPlaceholder="Tìm mã, hành động hoặc chủ thể"
          filters={["Module", "Kết quả", "Thời gian"]}
        />
        <StaticTable
          caption="Nhật ký kiểm toán mẫu"
          headers={[
            "Mã sự kiện",
            "Hành động",
            "Module",
            "Chủ thể",
            "Thời gian",
            "Kết quả",
            "",
          ]}
          rows={rows}
        />
      </ProductPanel>
    </>
  );
}
