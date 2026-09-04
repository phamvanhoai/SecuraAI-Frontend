import { ReferenceModulePage } from "@/features/reference-modules";
export default function Page() {
  return (
    <ReferenceModulePage
      title="Đào tạo nhận thức"
      description="Quản lý khóa học và theo dõi tiến độ nhận thức an toàn thông tin."
      action="Tạo khóa học"
      tableTitle="Danh sách khóa học"
      columns={["Mã", "Khóa học", "Hình thức", "Học viên", "Trạng thái"]}
      metrics={[
        {
          label: "Tổng khóa học",
          value: "24",
          detail: "Dữ liệu mẫu",
          tone: "brand",
        },
        {
          label: "Học viên",
          value: "356",
          detail: "Đang được ghi danh",
          tone: "brand",
        },
        {
          label: "Đã hoàn thành",
          value: "268",
          detail: "75,3% học viên",
          tone: "brand",
        },
        {
          label: "Đang học",
          value: "62",
          detail: "Trong tiến độ",
          tone: "warning",
        },
      ]}
      rows={[
        [
          "TRN-SEC-001",
          "Nhận biết và phòng tránh ransomware",
          "E-learning",
          "124",
          "Đã xuất bản",
        ],
        [
          "TRN-SEC-002",
          "Social Engineering và kỹ thuật lừa đảo",
          "E-learning",
          "98",
          "Đã xuất bản",
        ],
        [
          "TRN-SEC-003",
          "Bảo mật Wi-Fi và mạng không dây",
          "Video",
          "76",
          "Đã xuất bản",
        ],
        [
          "TRN-SEC-004",
          "Quy định và chính sách nội bộ",
          "Tài liệu",
          "142",
          "Bản nháp",
        ],
      ]}
      insightTitle="Tiến độ học tập"
      insights={[
        { label: "Đã hoàn thành", value: "268", tone: "success" },
        { label: "Đang học", value: "62", tone: "warning" },
        { label: "Chưa bắt đầu", value: "26", tone: "danger" },
      ]}
    />
  );
}
