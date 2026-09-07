import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
  Siren,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
  type Metric,
} from "@/components/data-display/static-product";

export type RolePanelKind =
  "security-officer" | "employee" | "executive-auditor";

const panels: Record<
  RolePanelKind,
  {
    title: string;
    description: string;
    metrics: readonly Metric[];
    tasksTitle: string;
    tasks: readonly [
      string,
      string,
      "danger" | "warning" | "info" | "success",
    ][];
    actions: readonly [string, string][];
    secondaryTitle: string;
    secondaryItems: readonly [string, string][];
  }
> = {
  "security-officer": {
    title: "Panel Chuyên viên ATTT",
    description:
      "Không gian vận hành tài sản, rủi ro, sự cố và cảnh báo an toàn thông tin.",
    metrics: [
      {
        label: "Rủi ro rất cao",
        value: "23",
        detail: "Cần xử lý ưu tiên",
        tone: "danger",
      },
      {
        label: "Sự cố đang mở",
        value: "23",
        detail: "5 sự cố nghiêm trọng",
        tone: "warning",
      },
      {
        label: "Cảnh báo AI mới",
        value: "12",
        detail: "Trong 24 giờ",
        tone: "brand",
      },
      {
        label: "Đánh giá đến hạn",
        value: "8",
        detail: "Trong 7 ngày",
        tone: "neutral",
      },
    ],
    tasksTitle: "Hàng đợi xử lý ưu tiên",
    tasks: [
      ["Rò rỉ dữ liệu qua tài khoản đặc quyền", "RISK-2026-018", "danger"],
      [
        "Đăng nhập bất thường vào tài khoản quản trị",
        "INC-2026-083",
        "warning",
      ],
      ["Cảnh báo tải dữ liệu bất thường", "ALT-2026-241", "info"],
    ],
    actions: [
      ["Đánh giá rủi ro", "/risks"],
      ["Xử lý sự cố", "/incidents"],
      ["Phân tích cảnh báo", "/alerts"],
      ["Quản lý tài sản", "/assets"],
    ],
    secondaryTitle: "Tiến độ kiểm soát",
    secondaryItems: [
      ["Kiểm soát đã đánh giá", "121 / 146"],
      ["Bằng chứng sắp hết hạn", "14"],
      ["Kế hoạch xử lý đúng hạn", "82%"],
    ],
  },
  employee: {
    title: "Panel Nhân viên",
    description:
      "Theo dõi nhiệm vụ bảo mật cá nhân, chính sách và chương trình đào tạo được giao.",
    metrics: [
      {
        label: "Khóa học đang học",
        value: "2",
        detail: "1 khóa sắp đến hạn",
        tone: "warning",
      },
      {
        label: "Chính sách cần đọc",
        value: "3",
        detail: "Xác nhận trước 15/09",
        tone: "brand",
      },
      {
        label: "Tài sản phụ trách",
        value: "5",
        detail: "Không có cảnh báo mới",
        tone: "neutral",
      },
      {
        label: "Thông báo chưa đọc",
        value: "6",
        detail: "2 thông báo ưu tiên",
        tone: "brand",
      },
    ],
    tasksTitle: "Việc cần hoàn thành",
    tasks: [
      ["Hoàn thành khóa học phòng chống phishing", "Hạn 12/09/2026", "warning"],
      ["Xác nhận chính sách bảo mật dữ liệu", "Hạn 15/09/2026", "info"],
      ["Rà soát thông tin Laptop SEC-LT-083", "Hạn 18/09/2026", "success"],
    ],
    actions: [
      ["Đào tạo của tôi", "/training"],
      ["Chính sách", "/policies"],
      ["Báo cáo sự cố", "/incidents"],
      ["Thông báo", "/notifications"],
    ],
    secondaryTitle: "Tiến độ cá nhân",
    secondaryItems: [
      ["Đào tạo hoàn thành", "4 / 6"],
      ["Chính sách đã xác nhận", "12 / 15"],
      ["Nhiệm vụ đúng hạn", "96%"],
    ],
  },
  "executive-auditor": {
    title: "Panel Lãnh đạo / Kiểm toán",
    description:
      "Tổng hợp xu hướng rủi ro, tuân thủ, phê duyệt và bằng chứng phục vụ điều hành.",
    metrics: [
      {
        label: "Tỷ lệ tuân thủ",
        value: "85%",
        detail: "Tăng 5,6% trong quý",
        tone: "brand",
      },
      {
        label: "Chờ phê duyệt",
        value: "7",
        detail: "2 yêu cầu ưu tiên",
        tone: "warning",
      },
      {
        label: "Rủi ro rất cao",
        value: "23",
        detail: "Giảm 3 so với tháng trước",
        tone: "danger",
      },
      {
        label: "KPI đạt mục tiêu",
        value: "9/12",
        detail: "3 KPI cần theo dõi",
        tone: "neutral",
      },
    ],
    tasksTitle: "Yêu cầu cần quyết định",
    tasks: [
      ["Kế hoạch xử lý RISK-2026-018", "Chờ phê duyệt", "danger"],
      ["Ngoại lệ kiểm soát A.8.8", "Cần xem xét", "warning"],
      ["Báo cáo tuân thủ quý III", "Sẵn sàng", "success"],
    ],
    actions: [
      ["Báo cáo điều hành", "/reports"],
      ["Tình trạng tuân thủ", "/compliance"],
      ["Nhật ký kiểm toán", "/audits"],
      ["Dashboard tùy chỉnh", "/custom-dashboard"],
    ],
    secondaryTitle: "Tổng quan quản trị",
    secondaryItems: [
      ["Rủi ro đã xử lý trong quý", "34"],
      ["Phát hiện kiểm toán mở", "11"],
      ["Sự cố nghiêm trọng", "5"],
    ],
  },
};

export function RolePanel({ kind }: { kind: RolePanelKind }) {
  const panel = panels[kind];
  return (
    <>
      <ProductPageHeader title={panel.title} description={panel.description} />
      <MetricStrip metrics={panel.metrics} />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <ProductPanel title={panel.tasksTitle}>
          <div className="divide-border divide-y">
            {panel.tasks.map(([title, detail, tone]) => (
              <div className="flex items-center gap-3 p-4" key={title}>
                <span className="bg-brand-soft text-brand grid size-9 place-items-center rounded-lg">
                  {kind === "employee" ? (
                    <BookOpenCheck className="size-4" />
                  ) : kind === "security-officer" ? (
                    <ShieldAlert className="size-4" />
                  ) : (
                    <FileCheck2 className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-muted mt-1 text-xs">{detail}</p>
                </div>
                <StatusBadge tone={tone}>
                  {tone === "success"
                    ? "Sẵn sàng"
                    : tone === "danger"
                      ? "Ưu tiên"
                      : "Cần xử lý"}
                </StatusBadge>
              </div>
            ))}
          </div>
        </ProductPanel>
        <ProductPanel title={panel.secondaryTitle}>
          <div className="space-y-4 p-5">
            {panel.secondaryItems.map(([label, value]) => (
              <div
                className="flex items-center justify-between gap-4"
                key={label}
              >
                <span className="text-muted text-sm">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </ProductPanel>
      </div>
      <ProductPanel className="mt-5" title="Truy cập nhanh">
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {panel.actions.map(([label, href], index) => (
            <Link
              className="border-border hover:bg-neutral-soft flex min-h-20 items-center gap-3 rounded-lg border p-4 transition-colors"
              href={`/${kind}${href}`}
              key={href}
            >
              {index === 0 ? (
                <Siren className="text-brand size-5" />
              ) : index === 1 ? (
                <CheckCircle2 className="text-brand size-5" />
              ) : index === 2 ? (
                <Clock3 className="text-brand size-5" />
              ) : (
                <UserRound className="text-brand size-5" />
              )}
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ArrowUpRight className="text-muted size-4" />
            </Link>
          ))}
        </div>
      </ProductPanel>
    </>
  );
}
