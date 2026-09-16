"use client";

import {
  Bell,
  Building2,
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
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

import {
  ApiKeysTab,
  IntegrationManagementView,
  useIntegrations,
} from "@/features/integrations";

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
          {activeTab === "api" && (
            <ApiKeySettings
              onNavigateToIntegrations={() => setActiveTab("integrations")}
            />
          )}
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

function ApiKeySettings({
  onNavigateToIntegrations,
}: {
  onNavigateToIntegrations?: () => void;
}) {
  const { data, isLoading, isError, refetch } = useIntegrations();
  const integrations = data?.items ?? [];
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>("");

  const effectiveIntegrationId =
    selectedIntegrationId || (integrations.length > 0 ? (integrations[0]?.id ?? "") : "");

  const activeIntegration = integrations.find(
    (i) => i.id === effectiveIntegrationId,
  );

  return (
    <ProductPanel
      title="Khóa API"
      description="Quản lý và cấp phát API Key / Secret Token xác thực cho các hệ thống SIEM & Firewall tích hợp."
    >
      <div className="space-y-6 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-9 w-64 animate-pulse rounded bg-neutral-soft/60" />
            <div className="h-40 animate-pulse rounded bg-neutral-soft/40" />
          </div>
        ) : isError ? (
          <div className="border-danger/30 bg-danger/10 text-danger flex items-center justify-between rounded-lg border p-4 text-xs">
            <span>Đã xảy ra lỗi khi tải danh sách tích hợp.</span>
            <button
              className="bg-surface ring-border hover:bg-neutral-soft rounded px-2.5 py-1 text-xs font-semibold ring-1"
              onClick={() => refetch()}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : integrations.length === 0 ? (
          <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <div className="text-muted flex size-10 items-center justify-center rounded-lg bg-neutral-soft">
              <Link2 className="size-5" />
            </div>
            <h4 className="text-foreground mt-3 text-sm font-semibold">
              Chưa có kết nối SIEM / Firewall nào
            </h4>
            <p className="text-muted mt-1 max-w-md text-xs">
              Khóa API được quản lý theo từng hệ thống tích hợp bên ngoài. Vui lòng thiết lập cấu hình tích hợp (Wazuh, Splunk, FortiGate...) trước khi quản lý khóa API.
            </p>
            {onNavigateToIntegrations ? (
              <button
                className="bg-brand text-brand-contrast hover:bg-brand-strong mt-4 inline-flex min-h-8 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors"
                onClick={onNavigateToIntegrations}
                type="button"
              >
                <Plus className="size-3.5" />
                Đến cấu hình Tích hợp
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Integration Selector */}
            <div className="border-border bg-neutral-soft/30 flex flex-col gap-3 rounded-lg border p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label className="text-foreground text-xs font-medium">
                  Chọn hệ thống tích hợp
                </Label>
                <p className="text-muted text-[11px]">
                  Xem và quản lý các API Key thuộc hệ thống tích hợp được chọn
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  className="h-8 min-w-[14rem] text-xs"
                  onChange={(e) => setSelectedIntegrationId(e.target.value)}
                  value={effectiveIntegrationId}
                >
                  {integrations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.integrationType})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Active Integration API Keys Component */}
            {effectiveIntegrationId ? (
              <div className="border-border bg-surface rounded-lg border p-4">
                <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-xs font-semibold">
                      Khóa API cho {activeIntegration?.name}
                    </span>
                    <span className="text-muted text-[11px]">
                      ({activeIntegration?.integrationType} · {activeIntegration?.baseUrl})
                    </span>
                  </div>
                </div>
                <ApiKeysTab integrationId={effectiveIntegrationId} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </ProductPanel>
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

