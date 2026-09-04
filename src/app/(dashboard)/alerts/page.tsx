import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Cảnh báo an toàn thông tin"
      description="Theo dõi và phân loại các cảnh báo cần xử lý trong hệ thống."
      action="Tạo quy tắc"
      tableTitle="Cảnh báo gần nhất"
      columns={["Mã", "Cảnh báo", "Nguồn", "Mức độ", "Trạng thái"]}
      metrics={[
        {
          label: "Cảnh báo 24h",
          value: "48",
          detail: "Dữ liệu mẫu",
          tone: "danger",
        },
        {
          label: "Nghiêm trọng",
          value: "5",
          detail: "Cần ưu tiên",
          tone: "danger",
        },
        {
          label: "Đang xử lý",
          value: "11",
          detail: "Theo phân công",
          tone: "warning",
        },
        {
          label: "Đã xử lý",
          value: "32",
          detail: "Trong 24 giờ",
          tone: "brand",
        },
      ]}
      rows={[
        [
          "ALT-2048",
          "Đăng nhập từ quốc gia bất thường",
          "Windows Server",
          "Nghiêm trọng",
          "Mới",
        ],
        [
          "ALT-2047",
          "Brute force SSH từ địa chỉ lạ",
          "Firewall",
          "Cao",
          "Đang xử lý",
        ],
        [
          "ALT-2046",
          "Truy cập trái phép vào dữ liệu",
          "Database",
          "Cao",
          "Mới",
        ],
        [
          "ALT-2045",
          "Tải tệp bất thường",
          "Web Access",
          "Trung bình",
          "Đã xử lý",
        ],
      ]}
      insightTitle="Phân bố mức độ"
      insights={[
        { label: "Nghiêm trọng", value: "5", tone: "danger" },
        { label: "Cao", value: "16", tone: "warning" },
        { label: "Trung bình", value: "18", tone: "info" },
        { label: "Thấp", value: "9", tone: "success" },
      ]}
    />
  );
}
