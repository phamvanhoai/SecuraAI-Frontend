import {
  Bell,
  Building2,
  KeyRound,
  Link2,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <>
      <ProductPageHeader
        title="Cài đặt hệ thống"
        description="Cấu hình thông tin tổ chức, chính sách bảo mật, thông báo và tích hợp."
      />
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Nhóm cài đặt"
          className="border-border bg-surface h-fit rounded-xl border p-2"
        >
          <SettingNav icon={<Building2 />} label="Tổ chức" active />
          <SettingNav icon={<ShieldCheck />} label="Bảo mật" />
          <SettingNav icon={<Bell />} label="Thông báo" />
          <SettingNav icon={<Link2 />} label="Tích hợp" />
          <SettingNav icon={<KeyRound />} label="API và khóa" />
        </nav>
        <div className="space-y-6">
          <ProductPanel
            title="Thông tin tổ chức"
            description="Thông tin mẫu hiển thị trong báo cáo và thông báo hệ thống."
          >
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field label="Tên tổ chức">
                <Input defaultValue="Công ty Cổ phần Secura Việt Nam" />
              </Field>
              <Field label="Mã tổ chức">
                <Input defaultValue="SECURA-VN" />
              </Field>
              <Field label="Múi giờ">
                <Select defaultValue="asia-ho-chi-minh">
                  <option value="asia-ho-chi-minh">Asia/Ho_Chi_Minh</option>
                </Select>
              </Field>
              <Field label="Ngôn ngữ">
                <Select defaultValue="vi">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </Select>
              </Field>
            </div>
            <SaveBar />
          </ProductPanel>
          <ProductPanel
            title="Chính sách phiên đăng nhập"
            description="Giá trị giao diện mẫu, chưa thay đổi cấu hình backend."
          >
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field label="Thời hạn access token">
                <Input value="15 phút" readOnly />
              </Field>
              <Field label="Thời hạn refresh token">
                <Input value="7 ngày" readOnly />
              </Field>
              <Field label="Số phiên tối đa">
                <Input defaultValue="5" type="number" />
              </Field>
              <Field label="Khóa sau số lần thất bại">
                <Input defaultValue="10" type="number" />
              </Field>
            </div>
            <SaveBar />
          </ProductPanel>
          <ProductPanel title="Tích hợp">
            <div className="space-y-3 p-5">
              <Integration name="Microsoft Entra ID" status="Chưa kết nối" />
              <Integration
                name="Splunk Enterprise Security"
                status="Đang hoạt động"
                active
              />
              <Integration name="Email SMTP" status="Đang hoạt động" active />
            </div>
          </ProductPanel>
        </div>
      </div>
    </>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function SettingNav({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active ? "bg-brand-soft text-brand" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {label}
    </button>
  );
}
function SaveBar() {
  return (
    <div className="border-border flex justify-end border-t px-5 py-4">
      <button className="bg-brand text-brand-contrast inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold">
        <Save className="size-4" />
        Lưu thay đổi
      </button>
    </div>
  );
}
function Integration({
  name,
  status,
  active = false,
}: {
  name: string;
  status: string;
  active?: boolean;
}) {
  return (
    <div className="bg-neutral-soft flex items-center justify-between gap-4 rounded-lg p-4">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-muted mt-1 text-xs">Cấu hình tích hợp mẫu</p>
      </div>
      <StatusBadge tone={active ? "success" : "neutral"}>{status}</StatusBadge>
    </div>
  );
}
