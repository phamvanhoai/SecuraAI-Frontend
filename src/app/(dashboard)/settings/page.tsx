"use client";

import {
  Bell,
  Building2,
  Copy,
  KeyRound,
  Link2,
  Plus,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

import { IntegrationManagementView } from "@/features/integrations";

type SettingsTab =
  "organization" | "security" | "notifications" | "integrations" | "api";
const tabs: readonly { id: SettingsTab; label: string; icon: ReactNode }[] = [
  { id: "organization", label: "Tổ chức", icon: <Building2 /> },
  { id: "security", label: "Bảo mật", icon: <ShieldCheck /> },
  { id: "notifications", label: "Thông báo", icon: <Bell /> },
  { id: "integrations", label: "Tích hợp", icon: <Link2 /> },
  { id: "api", label: "API và khóa", icon: <KeyRound /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
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
          {tabs.map((tab) => (
            <button
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-brand-soft text-brand" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="[&>svg]:size-4">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div aria-live="polite" className="space-y-6">
          {activeTab === "organization" && <OrganizationSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "integrations" && <IntegrationManagementView />}
          {activeTab === "api" && <ApiKeySettings />}
        </div>
      </div>
    </>
  );
}

function OrganizationSettings() {
  return (
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
        <Field label="Tên miền">
          <Input defaultValue="secura.vn" />
        </Field>
        <Field label="Email liên hệ">
          <Input defaultValue="security@secura.vn" type="email" />
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
      <SaveBar area="tổ chức" />
    </ProductPanel>
  );
}

function SecuritySettings() {
  return (
    <>
      <ProductPanel
        title="Chính sách phiên đăng nhập"
        description="Kiểm soát thời hạn phiên và số lần đăng nhập thất bại."
      >
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field label="Thời hạn access token">
            <Input value="15 phút" readOnly />
          </Field>
          <Field label="Thời hạn refresh token">
            <Input value="7 ngày" readOnly />
          </Field>
          <Field label="Số phiên tối đa">
            <Input defaultValue="5" min="1" type="number" />
          </Field>
          <Field label="Khóa sau số lần thất bại">
            <Input defaultValue="10" min="1" type="number" />
          </Field>
        </div>
        <SaveBar area="bảo mật" />
      </ProductPanel>
      <ProductPanel title="Xác thực và mật khẩu">
        <div className="space-y-4 p-5">
          <ToggleSetting
            defaultChecked
            label="Yêu cầu xác thực đa yếu tố cho quản trị viên"
          />
          <ToggleSetting
            defaultChecked
            label="Buộc đổi mật khẩu trong lần đăng nhập đầu tiên"
          />
          <ToggleSetting label="Cho phép đăng nhập đồng thời trên nhiều thiết bị" />
        </div>
      </ProductPanel>
    </>
  );
}

function NotificationSettings() {
  return (
    <ProductPanel
      title="Quy tắc thông báo"
      description="Chọn sự kiện và kênh nhận thông báo mặc định."
    >
      <div className="divide-border divide-y p-5">
        <NotificationRule
          title="Rủi ro nghiêm trọng"
          description="Thông báo khi phát hiện hoặc thay đổi rủi ro critical"
        />
        <NotificationRule
          title="Sự cố được phân công"
          description="Thông báo cho người hoặc nhóm phụ trách sự cố"
        />
        <NotificationRule
          title="Kiểm soát sắp đến hạn"
          description="Nhắc trước kỳ đánh giá và gia hạn bằng chứng"
        />
        <NotificationRule
          title="Báo cáo hoàn tất"
          description="Thông báo khi báo cáo theo lịch đã sẵn sàng"
        />
      </div>
      <SaveBar area="thông báo" />
    </ProductPanel>
  );
}


function ApiKeySettings() {
  const toast = useToast();
  return (
    <>
      <Alert>
        Backend chưa cung cấp endpoint quản lý khóa API. Các giá trị dưới đây
        chỉ mô tả giao diện và không chứa khóa thật.
      </Alert>
      <ProductPanel
        title="Khóa API"
        description="Quản lý thông tin định danh dùng cho tích hợp máy với máy."
      >
        <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Production SIEM</p>
            <p className="text-muted mt-1 text-sm">
              sk_live_••••••••7F2A · Chưa có dữ liệu backend
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="neutral">Chưa triển khai</StatusBadge>
            <button
              aria-label="Sao chép mã khóa mẫu"
              className="border-border hover:bg-neutral-soft rounded-lg border p-2"
              onClick={() =>
                toast.info(
                  "Không thể sao chép",
                  "Khóa mẫu không phải thông tin xác thực thật.",
                )
              }
              type="button"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-end p-5">
          <button
            className="bg-brand text-brand-contrast inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold opacity-60"
            disabled
            type="button"
          >
            <Plus className="size-4" />
            Tạo khóa API
          </button>
        </div>
      </ProductPanel>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SaveBar({ area }: { area: string }) {
  const toast = useToast();
  return (
    <div className="border-border flex justify-end border-t px-5 py-4">
      <button
        className="bg-brand text-brand-contrast hover:bg-brand-strong inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors active:translate-y-px"
        onClick={() =>
          toast.success(
            "Đã lưu thay đổi",
            `Cấu hình ${area} mẫu đã được cập nhật trên giao diện.`,
          )
        }
        type="button"
      >
        <Save className="size-4" />
        Lưu thay đổi
      </button>
    </div>
  );
}

function ToggleSetting({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Checkbox defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

function NotificationRule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted mt-1 text-xs">{description}</p>
      </div>
      <div className="flex gap-4">
        <ToggleSetting defaultChecked label="Trong ứng dụng" />
        <ToggleSetting defaultChecked label="Email" />
      </div>
    </div>
  );
}

