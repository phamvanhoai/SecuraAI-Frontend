"use client";

import { Ellipsis, Eye, Pencil, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSessionUser } from "@/features/auth";
import { usePolicyDraft, usePolicyDrafts } from "../hooks/use-policy-drafts";
import {
  policyDraftQuerySchema,
  type OwnedPolicyDraft,
  type PolicyDraftQuery,
} from "../schemas/policy-draft-schema";
import { PolicyDraftFormDialog } from "./policy-draft-form-dialog";

function queryFromParams(params: URLSearchParams): PolicyDraftQuery {
  const parsed = policyDraftQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  return parsed.success ? parsed.data : policyDraftQuerySchema.parse({});
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PolicyDraftsManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => queryFromParams(searchParams), [searchParams]);
  const session = useSessionUser();
  const canManageDrafts =
    session.data?.permissions.includes("policies.create") ?? false;
  const drafts = usePolicyDrafts(query, canManageDrafts);
  const [search, setSearch] = useState(query.q ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const [editing, setEditing] = useState<OwnedPolicyDraft | null>(null);
  const detail = usePolicyDraft(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  const items = drafts.data?.items ?? [];
  const describedCount = items.filter((draft) => draft.description).length;
  const documentedChangesCount = items.filter(
    (draft) => draft.version.changeSummary,
  ).length;

  const navigate = (next: Partial<PolicyDraftQuery>): void => {
    const parameters = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        parameters.set(key, String(value));
    });
    router.push(`${pathname}?${parameters.toString()}`);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    navigate({
      page: 1,
      ...(search.trim() ? { q: search.trim() } : { q: undefined }),
    });
  };
  const closeActionMenu = (event: MouseEvent<HTMLButtonElement>): void => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };
  const columns = useMemo<readonly DataTableColumn<OwnedPolicyDraft>[]>(
    () => [
      {
        key: "policy",
        header: "Chính sách",
        cell: (draft) => (
          <span className="block min-w-56">
            <strong className="block">{draft.title}</strong>
            <span className="text-muted text-xs">{draft.policyCode}</span>
          </span>
        ),
      },
      {
        key: "version",
        header: "Phiên bản",
        cell: (draft) => (
          <span className="tabular-nums">v{draft.version.versionNumber}</span>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        cell: () => <StatusBadge tone="neutral">Bản nháp</StatusBadge>,
      },
      {
        key: "updated",
        header: "Cập nhật",
        cell: (draft) => (
          <span className="whitespace-nowrap">
            {formatDate(draft.updatedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        cell: (draft) => (
          <DropdownMenu
            className="w-fit"
            label={
              <span className="grid size-6 place-items-center">
                <span className="sr-only">Thao tác cho {draft.title}</span>
                <Ellipsis
                  className="size-5"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            }
          >
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={(event) => {
                closeActionMenu(event);
                setSelected({
                  policyId: draft.policyId,
                  versionId: draft.version.id,
                });
              }}
              type="button"
            >
              <Eye className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Xem chi tiết
            </button>
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={(event) => {
                closeActionMenu(event);
                setEditing(draft);
              }}
              type="button"
            >
              <Pencil className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Chỉnh sửa
            </button>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  if (session.isPending)
    return (
      <p className="text-muted py-10 text-center">
        Đang kiểm tra quyền truy cập…
      </p>
    );
  if (!canManageDrafts) {
    return (
      <Alert>
        <strong className="block">
          Bạn không có quyền quản lý bản nháp chính sách
        </strong>
        <span>Liên hệ quản trị viên để được cấp quyền policies.create.</span>
      </Alert>
    );
  }

  return (
    <>
      <ProductPageHeader
        description="Soạn thảo và cập nhật các chính sách do bạn phụ trách trước khi gửi xuất bản."
        onPrimaryAction={() => setCreateOpen(true)}
        primaryAction="Tạo bản nháp"
        showSampleNotice={false}
        title="Bản nháp chính sách ATTT"
      />
      <MetricStrip
        ariaLabel="Chỉ số bản nháp chính sách"
        metrics={[
          {
            label: "Tổng bản nháp",
            value: drafts.data ? String(drafts.data.pagination.total) : "—",
            detail: "Trả về từ backend",
            tone: "brand",
          },
          {
            label: "Trên trang này",
            value: drafts.data ? String(items.length) : "—",
            detail: `Tối đa ${query.limit} bản nháp`,
            tone: "neutral",
          },
          {
            label: "Có mô tả",
            value: drafts.data ? String(describedCount) : "—",
            detail: "Trên trang này",
            tone: "neutral",
          },
          {
            label: "Có ghi chú thay đổi",
            value: drafts.data ? String(documentedChangesCount) : "—",
            detail: "Trên trang này",
            tone: "neutral",
          },
        ]}
      />
      <ProductPanel
        description={
          drafts.data
            ? `${drafts.data.pagination.total} bản nháp được tìm thấy`
            : "Đang tải dữ liệu backend"
        }
        title="Danh sách bản nháp"
      >
        <form
          aria-label="Bộ lọc bản nháp"
          className="border-border flex flex-col gap-2 border-b p-4 sm:flex-row"
          onSubmit={submitSearch}
        >
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Tìm theo mã hoặc tên chính sách</span>
            <Search
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <Input
              className="bg-background min-h-10 pl-9"
              maxLength={100}
              placeholder="Tìm theo mã hoặc tên chính sách"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <Select
            aria-label="Thứ tự cập nhật"
            className="min-h-10 sm:w-48"
            value={query.sortOrder}
            onChange={(event) =>
              navigate({
                page: 1,
                sortOrder: event.target.value === "asc" ? "asc" : "desc",
              })
            }
          >
            <option value="desc">Mới cập nhật trước</option>
            <option value="asc">Cũ cập nhật trước</option>
          </Select>
          <Button className="min-h-10" type="submit">
            Tìm kiếm
          </Button>
        </form>
        <div className="p-4">
          {drafts.isPending ? <DraftTableSkeleton /> : null}
          {drafts.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              <strong className="block">
                Không thể tải danh sách bản nháp
              </strong>
              <span>
                {drafts.error instanceof Error
                  ? drafts.error.message
                  : "Kiểm tra kết nối backend rồi thử lại."}
              </span>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => void drafts.refetch()}
              >
                Thử lại
              </Button>
            </Alert>
          ) : null}
          {drafts.data && drafts.data.items.length === 0 ? (
            <p className="text-muted py-10 text-center">
              Không tìm thấy bản nháp chính sách.
            </p>
          ) : null}
          {drafts.data && drafts.data.items.length > 0 ? (
            <DataTable
              columns={columns}
              rows={drafts.data.items}
              getRowKey={(draft) => draft.version.id}
            />
          ) : null}
        </div>
        {drafts.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={drafts.data.pagination.page}
              pageCount={drafts.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </ProductPanel>

      <PolicyDraftFormDialog
        open={createOpen}
        draft={null}
        onClose={() => setCreateOpen(false)}
      />
      <PolicyDraftFormDialog
        open={editing !== null}
        draft={editing}
        onClose={() => setEditing(null)}
      />
      <PolicyDraftDetailDialog
        draft={detail.data ?? null}
        pending={detail.isPending}
        error={detail.isError ? detail.error : null}
        open={selected !== null}
        onEdit={(draft) => {
          setSelected(null);
          setEditing(draft);
        }}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function DraftTableSkeleton() {
  return (
    <div
      aria-label="Đang tải danh sách bản nháp"
      className="space-y-3"
      role="status"
    >
      {[1, 2, 3].map((row) => (
        <div
          className="bg-neutral-soft h-14 animate-pulse rounded-lg motion-reduce:animate-none"
          key={row}
        />
      ))}
    </div>
  );
}

function PolicyDraftDetailDialog({
  draft,
  pending,
  error,
  open,
  onEdit,
  onClose,
}: {
  draft: OwnedPolicyDraft | null;
  pending: boolean;
  error: unknown;
  open: boolean;
  onEdit: (draft: OwnedPolicyDraft) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <Dialog
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      title="Chi tiết bản nháp"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {pending ? (
        <p className="text-muted py-10 text-center">Đang tải nội dung…</p>
      ) : null}
      {error ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger mt-4">
          {error instanceof Error ? error.message : "Không thể tải bản nháp."}
        </Alert>
      ) : null}
      {draft ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{draft.title}</h3>
              <p className="text-muted mt-1 text-sm break-all">
                {draft.policyCode}
              </p>
            </div>
            <StatusBadge tone="neutral">Bản nháp</StatusBadge>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Mã chính sách" value={draft.policyCode} />
            <Detail
              label="Phiên bản"
              value={`v${draft.version.versionNumber}`}
            />
            <Detail label="Ngày tạo" value={formatDate(draft.createdAt)} />
            <Detail label="Cập nhật" value={formatDate(draft.updatedAt)} />
          </dl>
          <div>
            <p className="text-muted text-xs font-semibold uppercase">Mô tả</p>
            <p className="mt-1 text-sm leading-6">
              {draft.description || "Không có mô tả"}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs font-semibold uppercase">
              Nội dung
            </p>
            <pre className="border-border bg-background mt-2 max-h-80 overflow-auto rounded-lg border p-4 font-sans text-sm leading-6 whitespace-pre-wrap">
              {draft.version.content}
            </pre>
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        {draft ? (
          <Button onClick={() => onEdit(draft)}>
            <Pencil className="size-4" aria-hidden="true" />
            Chỉnh sửa
          </Button>
        ) : null}
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
