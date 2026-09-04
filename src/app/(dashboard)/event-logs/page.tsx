import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Log và sự kiện"
      description="Tìm kiếm và phân tích nhật ký hệ thống cùng sự kiện bảo mật."
      action="Xuất log"
      tableTitle="Sự kiện gần nhất"
      columns={["Thời gian", "Sự kiện", "Nguồn", "Địa chỉ IP", "Mức độ"]}
      metrics={[
        {
          label: "Tổng log",
          value: "1,25M",
          detail: "Trong 7 ngày",
          tone: "brand",
        },
        {
          label: "Sự kiện",
          value: "8.542",
          detail: "Dữ liệu mẫu",
          tone: "brand",
        },
        {
          label: "Cảnh báo",
          value: "2.156",
          detail: "Cần phân loại",
          tone: "warning",
        },
        {
          label: "Nghiêm trọng",
          value: "128",
          detail: "Cần ưu tiên",
          tone: "danger",
        },
      ]}
      rows={[
        [
          "10:23:15",
          "Phát hiện brute force SSH",
          "Firewall",
          "203.162.4.15",
          "Nghiêm trọng",
        ],
        [
          "10:15:42",
          "Đăng nhập thất bại",
          "Windows Server",
          "192.168.1.45",
          "Cao",
        ],
        ["09:58:03", "Truy cập trái phép", "Web Server", "10.0.0.23", "Cao"],
        [
          "09:41:22",
          "Thay đổi cấu hình",
          "Firewall",
          "192.168.1.10",
          "Trung bình",
        ],
      ]}
      insightTitle="Nguồn phát sinh"
      insights={[
        { label: "Windows Server", value: "3.215", tone: "info" },
        { label: "Firewall", value: "2.013", tone: "success" },
        { label: "Web Server", value: "1.542", tone: "warning" },
        { label: "IDS", value: "1.026" },
      ]}
    />
  );
}
