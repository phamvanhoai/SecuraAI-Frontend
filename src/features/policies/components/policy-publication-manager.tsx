"use client";

import { Eye, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  usePolicyReview,
  usePublishablePolicies,
  usePublishPolicyVersion,
} from "../hooks/use-policy-publication";
import type {
  PublishablePolicy,
  PublishablePolicyQuery,
} from "../schemas/policy-publication-schema";

const initialQuery: PublishablePolicyQuery = {
  page: 1,
  limit: 20,
  sortBy: "updatedAt",
  sortOrder: "desc",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Vui lòng thử lại.";
}

export function PolicyPublicationManager() {
  const toast = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const [effectiveDate, setEffectiveDate] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const policies = usePublishablePolicies(query);
  const review = usePolicyReview(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  const publish = usePublishPolicyVersion();

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selected]);

  const columns = useMemo<readonly DataTableColumn<PublishablePolicy>[]>(
    () => [
      {
        key: "code",
        header: "Mã chính sách",
        cell: (item) => (
          <span className="font-semibold">{item.policyCode}</span>
        ),
      },
      { key: "title", header: "Tên chính sách", cell: (item) => item.title },
      {
        key: "version",
        header: "Phiên bản",
        cell: (item) => `v${item.draftVersion.versionNumber}`,
      },
      {
        key: "status",
        header: "Trạng thái",
        cell: () => <StatusBadge tone="warning">Chờ xuất bản</StatusBadge>,
      },
      {
        key: "updatedAt",
        header: "Cập nhật",
        cell: (item) => formatDate(item.updatedAt),
      },
      {
        key: "actions",
        header: "Thao tác",
        cell: (item) => (
          <Button
            aria-label={`Xem xét ${item.policyCode}`}
            className="min-h-10 px-3"
            onClick={() =>
              setSelected({
                policyId: item.id,
                versionId: item.draftVersion.id,
              })
            }
            variant="secondary"
          >
            <Eye aria-hidden="true" className="size-4" />
            Xem xét
          </Button>
        ),
      },
    ],
    [],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const q = search.trim();
    setQuery((current) => {
      if (q) return { ...current, page: 1, q };
      const next = { ...current };
      delete next.q;
      return { ...next, page: 1 };
    });
  }

  async function confirmPublish(): Promise<void> {
    if (!selected) return;
    try {
      await publish.mutateAsync({
        ...selected,
        ...(effectiveDate ? { effectiveDate } : {}),
      });
      toast.success(
        "Đã xuất bản chính sách",
        "Phiên bản chính thức đã được phát hành và ghi nhận nhật ký kiểm toán.",
      );
      setSelected(null);
      setEffectiveDate("");
    } catch (error: unknown) {
      toast.error("Không thể xuất bản chính sách", errorMessage(error));
    }
  }

  const total = policies.data?.pagination.total ?? 0;
  return (
    <>
      <ProductPageHeader
        description="Xem xét nội dung bản nháp và phát hành phiên bản chính thức của chính sách an toàn thông tin."
        showSampleNotice={false}
        title="Phê duyệt và xuất bản chính sách"
      />
      <MetricStrip
        ariaLabel="Thống kê chính sách chờ xuất bản"
        metrics={[
          {
            label: "Chờ xuất bản",
            value: String(total),
            detail: "Bản nháp có thể xem xét",
            tone: "warning",
            loading: policies.isPending,
          },
        ]}
      />
      <ProductPanel
        description="Chỉ các phiên bản đang ở trạng thái draft mới có thể được xuất bản."
        title="Danh sách chờ xuất bản"
      >
        <form
          className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row"
          onSubmit={submitSearch}
        >
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <span className="sr-only">Tìm chính sách</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên chính sách"
              value={search}
            />
          </label>
          <Button type="submit" variant="secondary">
            Tìm kiếm
          </Button>
        </form>
        <div className="p-4">
          {policies.isPending ? (
            <TableSkeleton
              columns={6}
              label="Đang tải chính sách chờ xuất bản"
            />
          ) : policies.isError ? (
            <Alert>
              <strong className="block">
                Không thể tải danh sách chờ xuất bản
              </strong>
              <span>{errorMessage(policies.error)}</span>
            </Alert>
          ) : (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={policies.data?.items ?? []}
            />
          )}
          <div className="mt-4">
            <Pagination
              onPageChange={(page) =>
                setQuery((current) => ({ ...current, page }))
              }
              page={query.page}
              pageCount={policies.data?.pagination.totalPages ?? 0}
            />
          </div>
        </div>
      </ProductPanel>

      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        onClose={() => setSelected(null)}
        title="Xem xét phiên bản chính sách"
      >
        {review.isPending ? (
          <div aria-label="Đang tải nội dung" className="space-y-3">
            <div className="bg-neutral-soft h-5 animate-pulse rounded" />
            <div className="bg-neutral-soft h-40 animate-pulse rounded" />
          </div>
        ) : review.isError ? (
          <Alert>{errorMessage(review.error)}</Alert>
        ) : review.data ? (
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs font-semibold uppercase">
                {review.data.policyCode} · v{review.data.version.versionNumber}
              </p>
              <h3 className="mt-1 text-base font-semibold">
                {review.data.title}
              </h3>
              {review.data.description ? (
                <p className="text-muted mt-1 text-sm">
                  {review.data.description}
                </p>
              ) : null}
            </div>
            <section
              aria-label="Nội dung chính sách"
              className="border-border bg-background max-h-72 overflow-y-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap"
            >
              {review.data.version.content}
            </section>
            {review.data.version.changeSummary ? (
              <p className="text-muted text-sm">
                <strong className="text-foreground">Tóm tắt thay đổi:</strong>{" "}
                {review.data.version.changeSummary}
              </p>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                Ngày hiệu lực
              </span>
              <Input
                onChange={(event) => setEffectiveDate(event.target.value)}
                type="date"
                value={effectiveDate}
              />
              <span className="text-muted mt-1 block text-xs">
                Để trống để sử dụng ngày xuất bản hiện tại.
              </span>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setSelected(null)} variant="secondary">
                Hủy
              </Button>
              <Button disabled={publish.isPending} onClick={confirmPublish}>
                {publish.isPending ? "Đang xuất bản..." : "Xuất bản phiên bản"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
