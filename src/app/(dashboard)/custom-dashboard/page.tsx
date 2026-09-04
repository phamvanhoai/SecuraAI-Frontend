import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Dashboard tùy chỉnh"
      description="Tổ chức các chỉ số theo nhu cầu theo dõi của từng vai trò."
      action="Thêm widget"
      tableTitle="Widget đang sử dụng"
      columns={["Mã", "Widget", "Nguồn dữ liệu", "Phạm vi", "Trạng thái"]}
      metrics={[
        {
          label: "Dashboard",
          value: "4",
          detail: "Theo vai trò",
          tone: "brand",
        },
        {
          label: "Widget",
          value: "18",
          detail: "Đang hiển thị",
          tone: "brand",
        },
        {
          label: "Nguồn dữ liệu",
          value: "8",
          detail: "Đã cấu hình",
          tone: "neutral",
        },
        {
          label: "Làm mới",
          value: "5 phút",
          detail: "Chu kỳ mẫu",
          tone: "warning",
        },
      ]}
      rows={[
        [
          "WDG-001",
          "Tổng quan rủi ro",
          "Risk Register",
          "Toàn tổ chức",
          "Hoạt động",
        ],
        [
          "WDG-002",
          "Xu hướng cảnh báo",
          "Security Events",
          "7 ngày",
          "Hoạt động",
        ],
        [
          "WDG-003",
          "Trạng thái tuân thủ",
          "Compliance",
          "Quý hiện tại",
          "Hoạt động",
        ],
        [
          "WDG-004",
          "Sự cố theo trạng thái",
          "Incidents",
          "30 ngày",
          "Tạm dừng",
        ],
      ]}
      insightTitle="Phân bố widget"
      insights={[
        { label: "Rủi ro", value: "6", tone: "danger" },
        { label: "Tuân thủ", value: "4", tone: "success" },
        { label: "Sự cố", value: "5", tone: "warning" },
        { label: "Khác", value: "3" },
      ]}
    />
  );
}
