import { MoreHorizontal } from "lucide-react";
import {
  MetricStrip,
  PaginationBar,
  ProductPageHeader,
  ProductPanel,
  ProductToolbar,
  StaticTable,
  StatusBadge,
} from "@/components/data-display/static-product";

const rows = [
  [
    <UserCell
      key="u1"
      initials="NA"
      name="Nguyễn Minh Anh"
      email="minh.anh@secura.vn"
    />,
    "SEC-0241",
    "An toàn thông tin",
    "Security Analyst",
    <StatusBadge tone="success" key="s1">
      Đang hoạt động
    </StatusBadge>,
    <RowMenu key="m1" />,
  ],
  [
    <UserCell
      key="u2"
      initials="TH"
      name="Trần Quốc Huy"
      email="quoc.huy@secura.vn"
    />,
    "SEC-0187",
    "Hạ tầng",
    "System Owner",
    <StatusBadge tone="success" key="s2">
      Đang hoạt động
    </StatusBadge>,
    <RowMenu key="m2" />,
  ],
  [
    <UserCell
      key="u3"
      initials="LP"
      name="Lê Hoàng Phương"
      email="hoang.phuong@secura.vn"
    />,
    "SEC-0318",
    "Kiểm toán nội bộ",
    "Internal Auditor",
    <StatusBadge tone="warning" key="s3">
      Chờ xác minh
    </StatusBadge>,
    <RowMenu key="m3" />,
  ],
  [
    <UserCell
      key="u4"
      initials="VT"
      name="Võ Thanh Tâm"
      email="thanh.tam@secura.vn"
    />,
    "SEC-0129",
    "Pháp chế",
    "Compliance Manager",
    <StatusBadge tone="success" key="s4">
      Đang hoạt động
    </StatusBadge>,
    <RowMenu key="m4" />,
  ],
  [
    <UserCell
      key="u5"
      initials="DN"
      name="Đặng Khánh Ngân"
      email="khanh.ngan@secura.vn"
    />,
    "SEC-0352",
    "Vận hành",
    "Asset Owner",
    <StatusBadge tone="neutral" key="s5">
      Tạm khóa
    </StatusBadge>,
    <RowMenu key="m5" />,
  ],
] as const;

function UserCell({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold">
        {initials}
      </span>
      <span>
        <span className="block font-medium">{name}</span>
        <span className="text-muted block text-xs">{email}</span>
      </span>
    </div>
  );
}
function RowMenu() {
  return (
    <button
      aria-label="Tùy chọn người dùng"
      className="text-muted hover:bg-neutral-soft grid size-8 place-items-center rounded-md"
    >
      <MoreHorizontal className="size-4" />
    </button>
  );
}

export default function UsersPage() {
  return (
    <>
      <ProductPageHeader
        title="Quản lý người dùng"
        description="Quản lý tài khoản, phòng ban, vai trò và trạng thái truy cập trong tổ chức."
        primaryAction="Thêm người dùng"
        secondaryAction="Xuất danh sách"
      />
      <MetricStrip
        metrics={[
          {
            label: "Tổng người dùng",
            value: "248",
            detail: "Dữ liệu mẫu",
            tone: "brand",
          },
          {
            label: "Đang hoạt động",
            value: "231",
            detail: "93,1% tài khoản",
            tone: "brand",
          },
          {
            label: "Chờ xác minh",
            value: "11",
            detail: "Cần xử lý",
            tone: "warning",
          },
          {
            label: "Tạm khóa",
            value: "6",
            detail: "Theo chính sách",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel
        title="Danh sách người dùng"
        description="Thông tin hiển thị chỉ dùng để duyệt thiết kế."
      >
        <ProductToolbar
          searchPlaceholder="Tìm theo tên, email, mã nhân viên"
          filters={["Phòng ban", "Vai trò", "Trạng thái"]}
        />
        <StaticTable
          caption="Danh sách người dùng mẫu"
          headers={[
            "Người dùng",
            "Mã nhân viên",
            "Phòng ban",
            "Vai trò",
            "Trạng thái",
            "",
          ]}
          rows={rows}
        />
        <PaginationBar label="Hiển thị 1-5 trong 248 người dùng mẫu" />
      </ProductPanel>
    </>
  );
}
