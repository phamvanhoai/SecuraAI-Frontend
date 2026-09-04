import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Giám sát bất thường"
      description="Phát hiện hành vi bất thường từ các nguồn nhật ký đang hoạt động."
      action="Cấu hình giám sát"
      tableTitle="Danh sách phát hiện"
      columns={["Mã", "Phát hiện", "Nguồn", "Điểm rủi ro", "Trạng thái"]}
      metrics={[
        {
          label: "Phát hiện 24h",
          value: "48",
          detail: "Dữ liệu mẫu",
          tone: "danger",
        },
        {
          label: "Mức cao",
          value: "16",
          detail: "Cần điều tra",
          tone: "danger",
        },
        {
          label: "Nguồn giám sát",
          value: "15",
          detail: "Đang hoạt động",
          tone: "brand",
        },
        {
          label: "Độ chính xác",
          value: "92,4%",
          detail: "Mô hình mẫu",
          tone: "brand",
        },
      ]}
      rows={[
        [
          "DET-2048",
          "Đăng nhập quốc gia bất thường",
          "Windows Logs",
          "95",
          "Mới",
        ],
        [
          "DET-2047",
          "Nhiều lần đăng nhập thất bại",
          "Firewall",
          "85",
          "Đang xử lý",
        ],
        ["DET-2046", "Truy cập dữ liệu nhạy cảm", "Database Logs", "78", "Mới"],
        ["DET-2045", "Tải tệp lớn bất thường", "Web Logs", "65", "Đã xử lý"],
      ]}
      insightTitle="Nguồn dữ liệu"
      insights={[
        { label: "Windows Logs", value: "Hoạt động", tone: "success" },
        { label: "Firewall", value: "Hoạt động", tone: "success" },
        { label: "Database", value: "Hoạt động", tone: "success" },
        { label: "VPN Logs", value: "Cảnh báo", tone: "warning" },
      ]}
    />
  );
}
