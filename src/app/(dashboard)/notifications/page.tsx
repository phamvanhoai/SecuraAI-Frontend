import { BellRing, CheckCheck, Clock3, ShieldAlert } from "lucide-react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";

const notifications = [
  {
    icon: <ShieldAlert />,
    title: "Rủi ro RSK-2026-041 đã quá hạn xử lý",
    body: "Kế hoạch giảm thiểu cần được chủ sở hữu cập nhật.",
    time: "12 phút trước",
    tone: "danger" as const,
    unread: true,
  },
  {
    icon: <BellRing />,
    title: "Có sự cố nghiêm trọng mới được phân công",
    body: "INC-2026-0087 đang chờ xác nhận từ đội SOC.",
    time: "24 phút trước",
    tone: "warning" as const,
    unread: true,
  },
  {
    icon: <Clock3 />,
    title: "12 bằng chứng sắp hết hạn",
    body: "Bằng chứng thuộc phạm vi PCI DSS hết hạn trong 30 ngày.",
    time: "2 giờ trước",
    tone: "info" as const,
    unread: false,
  },
  {
    icon: <CheckCheck />,
    title: "Báo cáo ISO 27001 đã sẵn sàng",
    body: "Tệp PDF đã được tạo và có thể tải xuống.",
    time: "Hôm qua",
    tone: "success" as const,
    unread: false,
  },
] as const;

export default function NotificationsPage() {
  return (
    <>
      <ProductPageHeader
        title="Thông báo"
        description="Theo dõi cảnh báo, tác vụ được phân công và cập nhật quan trọng trong hệ thống."
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ProductPanel title="Hộp thư thông báo">
          <div className="border-border flex gap-2 border-b px-5 py-3">
            <button className="bg-brand-soft text-brand rounded-lg px-3 py-2 text-sm font-medium">
              Tất cả
            </button>
            <button className="text-muted hover:bg-neutral-soft rounded-lg px-3 py-2 text-sm">
              Chưa đọc
            </button>
            <button className="text-muted hover:bg-neutral-soft rounded-lg px-3 py-2 text-sm">
              Quan trọng
            </button>
          </div>
          <div>
            {notifications.map((item) => (
              <article
                className="border-border flex gap-4 border-t p-5 first:border-t-0"
                key={item.title}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg [&>svg]:size-5 ${item.tone === "danger" ? "bg-danger-soft text-danger" : item.tone === "warning" ? "bg-warning-soft text-warning" : item.tone === "success" ? "bg-success-soft text-success" : "bg-info-soft text-info"}`}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-medium">{item.title}</h2>
                    {item.unread ? (
                      <StatusBadge tone="info">Chưa đọc</StatusBadge>
                    ) : null}
                  </div>
                  <p className="text-muted mt-1 text-sm leading-5">
                    {item.body}
                  </p>
                  <p className="text-muted mt-2 text-xs">{item.time}</p>
                </div>
              </article>
            ))}
          </div>
        </ProductPanel>
        <ProductPanel title="Tùy chọn nhận thông báo">
          <div className="space-y-4 p-5">
            <Preference
              title="Cảnh báo rủi ro"
              description="Email và trong ứng dụng"
              checked
            />
            <Preference
              title="Sự cố được phân công"
              description="Email và trong ứng dụng"
              checked
            />
            <Preference
              title="Báo cáo hoàn tất"
              description="Chỉ trong ứng dụng"
              checked
            />
            <Preference title="Bản tin hàng tuần" description="Email" />
          </div>
        </ProductPanel>
      </div>
    </>
  );
}
function Preference({
  title,
  description,
  checked = false,
}: {
  title: string;
  description: string;
  checked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted mt-1 block text-xs">{description}</span>
      </span>
      <input
        type="checkbox"
        defaultChecked={checked}
        className="accent-brand mt-1 size-4"
      />
    </label>
  );
}
