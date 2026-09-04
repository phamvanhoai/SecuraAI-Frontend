import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Mô hình AI"
      description="Theo dõi trạng thái và hiệu suất các mô hình phân tích bảo mật."
      action="Tạo mô hình"
      tableTitle="Danh sách mô hình"
      columns={[
        "Phiên bản",
        "Tên mô hình",
        "Mục đích",
        "Độ chính xác",
        "Trạng thái",
      ]}
      metrics={[
        {
          label: "Tổng mô hình",
          value: "12",
          detail: "Dữ liệu mẫu",
          tone: "brand",
        },
        {
          label: "Đang hoạt động",
          value: "8",
          detail: "Phục vụ phân tích",
          tone: "brand",
        },
        {
          label: "Đang huấn luyện",
          value: "2",
          detail: "Chưa triển khai",
          tone: "warning",
        },
        {
          label: "Cảnh báo",
          value: "2",
          detail: "Cần đánh giá",
          tone: "danger",
        },
      ]}
      rows={[
        [
          "v2.1.0",
          "Anomaly Detection",
          "Phát hiện bất thường",
          "94,2%",
          "Đang hoạt động",
        ],
        [
          "v1.3.2",
          "Risk Scoring Model",
          "Chấm điểm rủi ro",
          "91,6%",
          "Đang hoạt động",
        ],
        [
          "v3.0.1",
          "Phishing Detection",
          "Phát hiện phishing",
          "96,8%",
          "Đang hoạt động",
        ],
        [
          "v2.0.0",
          "Data Classification",
          "Phân loại dữ liệu",
          "Chưa có",
          "Đang huấn luyện",
        ],
      ]}
      insightTitle="Hiệu suất mô hình"
      insights={[
        { label: "Phân loại", value: "92,1%", tone: "success" },
        { label: "Hồi quy", value: "91,4%", tone: "success" },
        { label: "Phân cụm", value: "89,3%", tone: "info" },
      ]}
    />
  );
}
