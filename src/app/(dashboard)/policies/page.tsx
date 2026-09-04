import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Quản lý chính sách"
      description="Tạo lập, phê duyệt và theo dõi vòng đời chính sách an toàn thông tin."
      action="Tạo chính sách"
      tableTitle="Danh sách chính sách"
      columns={["Mã", "Tên chính sách", "Loại", "Phiên bản", "Trạng thái"]}
      metrics={[
        {
          label: "Tổng chính sách",
          value: "68",
          detail: "Dữ liệu mẫu",
          tone: "brand",
        },
        {
          label: "Đang hiệu lực",
          value: "42",
          detail: "Đã phê duyệt",
          tone: "brand",
        },
        {
          label: "Sắp hết hạn",
          value: "6",
          detail: "Trong 30 ngày",
          tone: "warning",
        },
        {
          label: "Đang soạn thảo",
          value: "12",
          detail: "Chờ hoàn thiện",
          tone: "neutral",
        },
      ]}
      rows={[
        [
          "POL-SEC-001",
          "Chính sách bảo mật thông tin",
          "Bảo mật",
          "v2.1",
          "Đang hiệu lực",
        ],
        [
          "POL-ACC-002",
          "Chính sách kiểm soát truy cập",
          "Truy cập",
          "v1.3",
          "Đang hiệu lực",
        ],
        [
          "POL-DATA-003",
          "Chính sách phân loại dữ liệu",
          "Dữ liệu",
          "v1.0",
          "Sắp hết hạn",
        ],
        [
          "POL-INC-004",
          "Chính sách quản lý sự cố",
          "Sự cố",
          "v1.2",
          "Đang hiệu lực",
        ],
      ]}
      insightTitle="Phân loại chính sách"
      insights={[
        { label: "Bảo mật", value: "26", tone: "info" },
        { label: "Truy cập", value: "12", tone: "success" },
        { label: "Dữ liệu", value: "10", tone: "warning" },
        { label: "Khác", value: "20" },
      ]}
    />
  );
}
