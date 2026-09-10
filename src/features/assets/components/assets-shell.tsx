"use client";

import { Search, Server } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAssets } from "../hooks/use-assets";
import { CreateAssetDialog } from "./create-asset-dialog";
import {
  assetListQuerySchema,
  type AssetListItem,
  type AssetListQuery,
} from "../schemas/asset-list-schema";

const criticalityLabels = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Rất cao",
} as const;
const statusLabels = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  retired: "Đã ngừng sử dụng",
  disposed: "Đã thanh lý",
} as const;

const columns: readonly DataTableColumn<AssetListItem>[] = [
  {
    key: "asset",
    header: "Tài sản",
    cell: (asset) => (
      <div className="flex items-center gap-3">
        <span className="bg-neutral-soft text-brand grid size-9 place-items-center rounded-lg">
          <Server className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-medium">{asset.name}</span>
          <span className="text-muted text-xs">{asset.assetCode}</span>
        </span>
      </div>
    ),
  },
  { key: "type", header: "Loại", cell: (asset) => asset.assetType },
  {
    key: "department",
    header: "Đơn vị",
    cell: (asset) => asset.department?.name ?? "Chưa gán",
  },
  {
    key: "owner",
    header: "Chủ sở hữu",
    cell: (asset) => asset.owner?.fullName ?? "Chưa gán",
  },
  {
    key: "criticality",
    header: "Mức quan trọng",
    cell: (asset) => criticalityLabels[asset.criticality],
  },
  {
    key: "status",
    header: "Trạng thái",
    cell: (asset) => statusLabels[asset.status],
  },
  {
    key: "updatedAt",
    header: "Cập nhật",
    cell: (asset) =>
      new Intl.DateTimeFormat("vi-VN").format(new Date(asset.updatedAt)),
  },
];

function queryFromSearchParams(parameters: URLSearchParams): AssetListQuery {
  const parsed = assetListQuerySchema.safeParse(
    Object.fromEntries(parameters.entries()),
  );
  return parsed.success ? parsed.data : assetListQuerySchema.parse({});
}

export function AssetsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () => queryFromSearchParams(searchParams),
    [searchParams],
  );
  const assets = useAssets(query);
  const [search, setSearch] = useState(query.q ?? "");
  const [assetType, setAssetType] = useState(query.assetType ?? "");
  const [criticality, setCriticality] = useState(query.criticality ?? "");
  const [status, setStatus] = useState(query.status ?? "");

  const navigate = (next: Partial<AssetListQuery>): void => {
    const parameters = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        parameters.set(key, String(value));
    });
    router.push(`/assets?${parameters.toString()}`);
  };
  const submitFilters = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const selectedCriticality = criticality
      ? assetListQuerySchema.shape.criticality.parse(criticality)
      : undefined;
    const selectedStatus = status
      ? assetListQuerySchema.shape.status.parse(status)
      : undefined;
    navigate({
      page: 1,
      ...(search.trim() ? { q: search.trim() } : { q: undefined }),
      ...(assetType.trim()
        ? { assetType: assetType.trim() }
        : { assetType: undefined }),
      criticality: selectedCriticality,
      status: selectedStatus,
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Quản lý tài sản
          </h1>
          <p className="text-muted mt-2 text-sm leading-6">
            Danh sách tài sản được tải trực tiếp từ hệ thống SecuraAI.
          </p>
        </div>
        <CreateAssetDialog />
      </header>
      <section className="border-border bg-surface overflow-hidden rounded-xl border">
        <div className="border-border border-b px-5 py-4">
          <h2 className="font-semibold">Danh mục tài sản</h2>
          <p className="text-muted mt-1 text-sm">
            {assets.data
              ? `${assets.data.pagination.total} tài sản phù hợp`
              : "Đang tải dữ liệu"}
          </p>
        </div>
        <form
          aria-label="Bộ lọc tài sản"
          className="border-border grid gap-3 border-b p-4 md:grid-cols-5"
          onSubmit={submitFilters}
        >
          <label className="relative md:col-span-2">
            <span className="sr-only">Tìm kiếm tài sản</span>
            <Search
              className="text-muted absolute top-3 left-3 size-4"
              aria-hidden="true"
            />
            <input
              className="border-border bg-background min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm"
              maxLength={100}
              placeholder="Tên, mã, hostname hoặc vị trí"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <input
            aria-label="Loại tài sản"
            className="border-border bg-background min-h-10 rounded-lg border px-3 text-sm"
            maxLength={50}
            placeholder="Loại tài sản"
            value={assetType}
            onChange={(event) => setAssetType(event.target.value)}
          />
          <Select
            aria-label="Mức quan trọng"
            value={criticality}
            onChange={(event) => setCriticality(event.target.value)}
          >
            <option value="">Mọi mức quan trọng</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="critical">Rất cao</option>
          </Select>
          <div className="flex gap-2">
            <Select
              aria-label="Trạng thái"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="retired">Đã ngừng</option>
              <option value="disposed">Đã thanh lý</option>
            </Select>
            <Button type="submit">Lọc</Button>
          </div>
        </form>
        <div className="p-4">
          {assets.isPending ? (
            <p className="text-muted py-10 text-center">
              Đang tải danh sách tài sản…
            </p>
          ) : null}
          {assets.isError ? (
            <Alert>
              <strong className="block">Không thể tải danh sách tài sản</strong>
              <span>
                Vui lòng kiểm tra đăng nhập và kết nối backend, sau đó thử lại.
              </span>
            </Alert>
          ) : null}
          {assets.data ? (
            <DataTable
              columns={columns}
              rows={assets.data.items}
              getRowKey={(asset) => asset.id}
            />
          ) : null}
        </div>
        {assets.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={assets.data.pagination.page}
              pageCount={assets.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
