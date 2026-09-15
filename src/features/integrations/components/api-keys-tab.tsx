"use client";

import {
  Ban,
  CheckCircle2,
  Copy,
  Edit2,
  Key,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useApiKeys,
  useRevokeApiKey,
  useUpdateApiKey,
} from "../hooks/use-integrations";
import type {
  ApiKeyStatus,
  IntegrationApiKey,
} from "../schemas/integration-schema";
import { ApiKeyModal, type ApiKeyModalMode } from "./api-key-modal";
import { OneTimeSecretDialog } from "./one-time-secret-dialog";

export function ApiKeyStatusBadge({ status }: { status: ApiKeyStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="size-3" />
        Hoạt động
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
        <ShieldAlert className="size-3" />
        Đã hết hạn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-soft px-2 py-0.5 text-[11px] font-medium text-muted border border-border">
      <Ban className="size-3" />
      Đã thu hồi / Vô hiệu hóa
    </span>
  );
}

export function ApiKeysTab({ integrationId }: { integrationId: string }) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryParams: { isActive?: boolean; search?: string } = {};
  if (statusFilter === "active") queryParams.isActive = true;
  if (statusFilter === "inactive") queryParams.isActive = false;
  if (searchTerm.trim()) queryParams.search = searchTerm.trim();

  const apiKeysQuery = useApiKeys({
    integrationId,
    ...queryParams,
  });

  const revokeMutation = useRevokeApiKey();
  const updateMutation = useUpdateApiKey();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ApiKeyModalMode>("create");
  const [selectedKey, setSelectedKey] = useState<IntegrationApiKey | null>(null);

  // Show-once secret dialog state
  const [secretDialogKeyName, setSecretDialogKeyName] = useState("");
  const [secretDialogPlaintext, setSecretDialogPlaintext] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);

  // Revoke confirm dialog state
  const [keyToRevoke, setKeyToRevoke] = useState<IntegrationApiKey | null>(null);

  function handleOpenCreate() {
    setSelectedKey(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleOpenEdit(key: IntegrationApiKey) {
    setSelectedKey(key);
    setModalMode("edit");
    setModalOpen(true);
  }

  function handleOpenRotate(key: IntegrationApiKey) {
    setSelectedKey(key);
    setModalMode("rotate");
    setModalOpen(true);
  }

  function handleSecretGenerated(name: string, secret: string) {
    setSecretDialogKeyName(name);
    setSecretDialogPlaintext(secret);
    setSecretDialogOpen(true);
  }

  async function handleCopyFingerprint(fingerprint: string | null | undefined) {
    if (!fingerprint) return;
    try {
      await navigator.clipboard.writeText(fingerprint);
      toast.info(
        "Đã sao chép Key Fingerprint",
        "Lưu ý: Đây là mã định danh đại diện, không phải là secret token.",
      );
    } catch {
      toast.error("Không thể sao chép");
    }
  }

  async function handleConfirmRevoke() {
    if (!keyToRevoke) return;
    try {
      await revokeMutation.mutateAsync({
        integrationId,
        keyId: keyToRevoke.id,
      });
      toast.success(`Đã thu hồi API Key "${keyToRevoke.keyName}"`);
      setKeyToRevoke(null);
    } catch {
      toast.error("Không thể thu hồi API Key");
    }
  }

  async function handleReactivate(key: IntegrationApiKey) {
    try {
      await updateMutation.mutateAsync({
        integrationId,
        keyId: key.id,
        input: {
          isActive: true,
        },
      });
      toast.success(`Đã kích hoạt lại API Key "${key.keyName}"`);
    } catch {
      toast.error("Không thể kích hoạt lại API Key");
    }
  }

  const keys = apiKeysQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* Action Header & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="text-muted absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              className="h-8 pl-8 text-xs"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên khóa..."
              value={searchTerm}
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs bg-neutral-soft/40">
            <button
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              Tất cả
            </button>
            <button
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "active"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setStatusFilter("active")}
              type="button"
            >
              Hoạt động
            </button>
            <button
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === "inactive"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setStatusFilter("inactive")}
              type="button"
            >
              Vô hiệu hóa
            </button>
          </div>
        </div>

        <Button
          className="min-h-8 shrink-0 px-3 text-xs"
          onClick={handleOpenCreate}
          type="button"
        >
          <Plus className="mr-1.5 size-3.5" />
          Thêm API Key mới
        </Button>
      </div>

      {/* Content State */}
      {apiKeysQuery.isLoading ? (
        <div className="space-y-2 p-4">
          <div className="h-10 animate-pulse rounded bg-neutral-soft/60" />
          <div className="h-14 animate-pulse rounded bg-neutral-soft/40" />
          <div className="h-14 animate-pulse rounded bg-neutral-soft/40" />
        </div>
      ) : apiKeysQuery.isError ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger text-xs flex items-center justify-between">
          <span>Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.</span>
          <Button
            className="min-h-7 px-2.5 text-xs"
            onClick={() => apiKeysQuery.refetch()}
            variant="secondary"
          >
            Thử lại
          </Button>
        </div>
      ) : keys.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="text-muted flex size-10 items-center justify-center rounded-lg bg-neutral-soft">
            <Key className="size-5" />
          </div>
          <h4 className="mt-3 text-xs font-semibold text-foreground">
            Chưa có API Key nào
          </h4>
          <p className="text-muted mt-1 max-w-sm text-[11px]">
            Tạo API Key để cung cấp thông tin xác thực an toàn cho các tác vụ đồng bộ dữ liệu và thu thập sự kiện bảo mật.
          </p>
          <Button
            className="mt-4 min-h-8 px-3 text-xs"
            onClick={handleOpenCreate}
            type="button"
          >
            <Plus className="mr-1.5 size-3.5" />
            Tạo API Key đầu tiên
          </Button>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-border bg-neutral-soft/50 text-muted border-b font-medium">
                <tr>
                  <th className="px-4 py-2.5">Tên định danh khóa</th>
                  <th className="px-4 py-2.5">Key Fingerprint</th>
                  <th className="px-4 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5">Hết hạn</th>
                  <th className="px-4 py-2.5">Ngày tạo</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {keys.map((key) => (
                  <tr
                    className="hover:bg-neutral-soft/30 transition-colors"
                    key={key.id}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="text-muted size-3.5 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {key.keyName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="border-border bg-neutral-soft/80 font-mono text-[11px] rounded border px-2 py-0.5 text-foreground select-all">
                          {key.keyFingerprint || "—"}
                        </span>
                        {key.keyFingerprint ? (
                          <button
                            aria-label="Sao chép Key Fingerprint"
                            className="text-muted hover:text-foreground p-1"
                            onClick={() => handleCopyFingerprint(key.keyFingerprint)}
                            title="Sao chép Key Fingerprint (nhận diện)"
                            type="button"
                          >
                            <Copy className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <ApiKeyStatusBadge status={key.status} />
                    </td>

                    <td className="text-muted px-4 py-3 text-[11px]">
                      {key.expiresAt
                        ? new Date(key.expiresAt).toLocaleString("vi-VN")
                        : "Không giới hạn"}
                    </td>

                    <td className="text-muted px-4 py-3 text-[11px]">
                      {new Date(key.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          aria-label={`Rotate API key ${key.keyName}`}
                          className="h-7 px-2 text-[11px] bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                          onClick={() => handleOpenRotate(key)}
                          title="Luân chuyển (Rotate) secret token mới"
                          type="button"
                        >
                          <RefreshCw className="mr-1 size-3" />
                          Rotate
                        </Button>

                        <Button
                          aria-label={`Chỉnh sửa API key ${key.keyName}`}
                          className="h-7 px-2 text-[11px] bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                          onClick={() => handleOpenEdit(key)}
                          title="Chỉnh sửa tên và thời hạn"
                          type="button"
                        >
                          <Edit2 className="size-3" />
                        </Button>

                        {key.isActive ? (
                          <Button
                            aria-label={`Thu hồi API key ${key.keyName}`}
                            className="h-7 px-2 text-[11px] text-danger ring-danger/30 hover:bg-danger/10 ring-1 bg-surface"
                            onClick={() => setKeyToRevoke(key)}
                            title="Thu hồi / Vô hiệu hóa API key này"
                            type="button"
                          >
                            <Ban className="size-3" />
                          </Button>
                        ) : (
                          <Button
                            aria-label={`Kích hoạt lại API key ${key.keyName}`}
                            className="h-7 px-2 text-[11px] text-emerald-400 ring-emerald-500/30 hover:bg-emerald-500/10 ring-1 bg-surface"
                            disabled={updateMutation.isPending}
                            onClick={() => handleReactivate(key)}
                            title="Kích hoạt lại API key này"
                            type="button"
                          >
                            <CheckCircle2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ApiKey Modal (Create / Edit / Rotate) */}
      <ApiKeyModal
        apiKey={selectedKey}
        integrationId={integrationId}
        key={`${modalMode}-${selectedKey?.id ?? "new"}-${modalOpen}`}
        mode={modalMode}
        onOpenChange={setModalOpen}
        onSecretGenerated={handleSecretGenerated}
        open={modalOpen}
      />

      {/* Show-Once Secret Dialog */}
      <OneTimeSecretDialog
        keyName={secretDialogKeyName}
        onClose={() => setSecretDialogOpen(false)}
        open={secretDialogOpen}
        secret={secretDialogPlaintext}
      />

      {/* Revoke Confirmation Dialog */}
      {keyToRevoke ? (
        <dialog
          aria-labelledby="revoke-confirm-title"
          className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
          open
        >
          <div className="border-border bg-surface border-b p-5">
            <div className="flex items-center gap-2.5">
              <div className="text-danger flex size-8 items-center justify-center rounded-lg bg-danger/10 border border-danger/20">
                <ShieldAlert className="size-4" />
              </div>
              <h3 id="revoke-confirm-title" className="text-sm font-semibold tracking-tight">
                Xác nhận thu hồi API Key
              </h3>
            </div>
          </div>

          <div className="space-y-4 p-5 text-xs">
            <p className="text-muted leading-relaxed">
              Bạn có chắc chắn muốn thu hồi khóa{" "}
              <strong className="text-foreground">{keyToRevoke.keyName}</strong>?
              Khóa này sẽ bị chuyển sang trạng thái <strong>Vô hiệu hóa</strong> và các kết nối sử dụng khóa này sẽ không thể tiếp tục xác thực.
            </p>

            <div className="border-border flex justify-end gap-2 border-t pt-4">
              <Button
                className="min-h-8 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                disabled={revokeMutation.isPending}
                onClick={() => setKeyToRevoke(null)}
                type="button"
              >
                Hủy
              </Button>
              <Button
                className="min-h-8 px-4 text-xs bg-danger hover:bg-danger/90 text-white"
                disabled={revokeMutation.isPending}
                onClick={handleConfirmRevoke}
                type="button"
              >
                {revokeMutation.isPending ? "Đang thu hồi..." : "Xác nhận Thu hồi"}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
