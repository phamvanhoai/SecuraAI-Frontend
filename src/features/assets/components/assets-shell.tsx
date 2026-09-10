"use client";

import { Download, Eye, History, MoreHorizontal, Pencil, Search, Server, Tags, Trash2, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/feedback/toast";
import { useSessionUser } from "@/features/auth";
import { useAssets } from "../hooks/use-assets";
import { useExportAssets } from "../hooks/use-export-assets";
import { CreateAssetDialog } from "./create-asset-dialog";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { EditAssetDialog } from "./edit-asset-dialog";
import { DeleteAssetDialog } from "./delete-asset-dialog";
import { ClassifyAssetCriticalityDialog } from "./classify-asset-criticality-dialog";
import { AssignAssetOwnerDialog } from "./assign-asset-owner-dialog";
import { ImportAssetsDialog } from "./import-assets-dialog";
import { AssetHistoryDialog } from "./asset-history-dialog";
import {
  assetListQuerySchema,
  type AssetListItem,
  type AssetListQuery,
} from "../schemas/asset-list-schema";

const criticalityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;
const statusLabels = {
  active: "Active", inactive: "Inactive", retired: "Retired", disposed: "Disposed",
} as const;

const columns: readonly DataTableColumn<AssetListItem>[] = [
  {
    key: "asset",
    header: "Asset",
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
  { key: "type", header: "Type", cell: (asset) => asset.assetType },
  {
    key: "department",
    header: "Department", cell: (asset) => asset.department?.name ?? "Unassigned",
  },
  {
    key: "owner",
    header: "Owner", cell: (asset) => asset.owner?.fullName ?? "Unassigned",
  },
  {
    key: "criticality",
    header: "Criticality",
    cell: (asset) => criticalityLabels[asset.criticality],
  },
  {
    key: "status",
    header: "Status",
    cell: (asset) => statusLabels[asset.status],
  },
  {
    key: "updatedAt",
    header: "Updated",
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
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const canRead = permissions.includes("assets.read");
  const canCreate = permissions.includes("assets.create");
  const canUpdate = permissions.includes("assets.update");
  const canDelete = permissions.includes("assets.delete");
  const canClassify = permissions.includes("assets.classify");
  const canAssignOwner = permissions.includes("assets.assign-owner");
  const canImport = permissions.includes("assets.import");
  const canExport = permissions.includes("assets.export");
  const canReadHistory = permissions.includes("assets.history.read");
  const assets = useAssets(query, canRead);
  const exportMutation = useExportAssets();
  const toast = useToast();
  const [search, setSearch] = useState(query.q ?? "");
  const [assetType, setAssetType] = useState(query.assetType ?? "");
  const [criticality, setCriticality] = useState(query.criticality ?? "");
  const [status, setStatus] = useState(query.status ?? "");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetListItem | null>(null);
  const [classifyingAsset, setClassifyingAsset] = useState<AssetListItem | null>(null);
  const [assigningOwnerAsset, setAssigningOwnerAsset] = useState<AssetListItem | null>(null);
  const [historyAssetId, setHistoryAssetId] = useState<string | null>(null);
  const tableColumns = useMemo<readonly DataTableColumn<AssetListItem>[]>(
    () => [
      ...columns,
      {
        key: "actions",
        header: "Actions",
        cell: (asset) => (
          <AssetActionMenu
            asset={asset}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canClassify={canClassify}
            canAssignOwner={canAssignOwner}
            canReadHistory={canReadHistory}
            onView={() => setSelectedAssetId(asset.id)}
            onEdit={() => setEditingAssetId(asset.id)}
            onDelete={() => setDeletingAsset(asset)}
            onClassify={() => setClassifyingAsset(asset)}
            onAssignOwner={() => setAssigningOwnerAsset(asset)}
            onHistory={() => setHistoryAssetId(asset.id)}
          />
        ),
      },
    ],
    [canAssignOwner, canClassify, canDelete, canReadHistory, canUpdate],
  );

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
  const exportList = async (): Promise<void> => {
    try {
      await exportMutation.mutateAsync(query);
      toast.success("Asset list exported", "Your Excel file is downloading.");
    } catch (error: unknown) {
      toast.error(
        "Unable to export asset list",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  if (session.isPending) {
    return <p className="text-muted py-10 text-center">Checking access permissions…</p>;
  }
  if (!canRead) {
    return (
      <Alert>
        <strong className="block">You do not have permission to view the asset list</strong>
        <span>Contact an administrator if you need the assets.read permission.</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Asset Management
          </h1>
          <p className="text-muted mt-2 text-sm leading-6">
            Asset list loaded directly from SecuraAI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canImport ? <ImportAssetsDialog /> : null}
          {canExport ? (
            <Button
              type="button"
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              disabled={exportMutation.isPending}
              onClick={exportList}
            >
              <Download className="size-4" aria-hidden="true" />
              {exportMutation.isPending ? "Exporting…" : "Export Excel"}
            </Button>
          ) : null}
          {canCreate ? <CreateAssetDialog /> : null}
        </div>
      </header>
      <section className="border-border bg-surface overflow-hidden rounded-xl border">
        <div className="border-border border-b px-5 py-4">
          <h2 className="font-semibold">Asset Directory</h2>
          <p className="text-muted mt-1 text-sm">
            {assets.data
              ? `${assets.data.pagination.total} matching assets`
              : "Loading data"}
          </p>
        </div>
        <form
          aria-label="Asset filters"
          className="border-border grid gap-3 border-b p-4 md:grid-cols-5"
          onSubmit={submitFilters}
        >
          <label className="relative md:col-span-2">
            <span className="sr-only">Search assets</span>
            <Search
              className="text-muted absolute top-3 left-3 size-4"
              aria-hidden="true"
            />
            <input
              className="border-border bg-background min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm"
              maxLength={100}
              placeholder="Name, code, hostname, or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <input
            aria-label="Asset type"
            className="border-border bg-background min-h-10 rounded-lg border px-3 text-sm"
            maxLength={50}
            placeholder="Asset type"
            value={assetType}
            onChange={(event) => setAssetType(event.target.value)}
          />
          <Select
            aria-label="Criticality"
            value={criticality}
            onChange={(event) => setCriticality(event.target.value)}
          >
            <option value="">All criticality levels</option><option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <div className="flex gap-2">
            <Select
              aria-label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="retired">Retired</option><option value="disposed">Disposed</option>
            </Select>
            <Button type="submit">Filter</Button>
          </div>
        </form>
        <div className="p-4">
          {assets.isPending ? (
            <p className="text-muted py-10 text-center">
              Loading asset list…
            </p>
          ) : null}
          {assets.isError ? (
            <Alert>
              <strong className="block">Unable to load asset list</strong>
              <span>
                Check your login and backend connection, then try again.
              </span>
            </Alert>
          ) : null}
          {assets.data ? (
            <DataTable
              columns={tableColumns}
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
      <AssetDetailDialog
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
      />
      <EditAssetDialog
        assetId={editingAssetId}
        onClose={() => setEditingAssetId(null)}
      />
      <DeleteAssetDialog
        asset={deletingAsset}
        onClose={() => setDeletingAsset(null)}
      />
      <ClassifyAssetCriticalityDialog
        asset={classifyingAsset}
        onClose={() => setClassifyingAsset(null)}
      />
      <AssignAssetOwnerDialog
        asset={assigningOwnerAsset}
        onClose={() => setAssigningOwnerAsset(null)}
      />
      <AssetHistoryDialog assetId={historyAssetId} onClose={() => setHistoryAssetId(null)} />
    </div>
  );
}

function AssetActionMenu({
  asset,
  canUpdate,
  canDelete,
  canClassify,
  canAssignOwner,
  canReadHistory,
  onView,
  onEdit,
  onDelete,
  onClassify,
  onAssignOwner,
  onHistory,
}: {
  asset: AssetListItem;
  canUpdate: boolean;
  canDelete: boolean;
  canClassify: boolean;
  canAssignOwner: boolean;
  canReadHistory: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClassify: () => void;
  onAssignOwner: () => void;
  onHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const disposed = asset.status === "disposed";

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const run = (action: () => void): void => {
    setOpen(false);
    action();
  };
  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        className="min-h-9 min-w-9 bg-neutral-soft px-2 text-foreground hover:bg-border"
        aria-label={`Actions for ${asset.assetCode}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </Button>
      {open ? (
        <div
          role="menu"
          aria-label={`Actions for ${asset.assetCode}`}
          className="border-border bg-surface absolute right-0 z-20 mt-2 grid min-w-48 gap-1 rounded-lg border p-1 shadow-lg"
        >
          <MenuAction icon={<Eye className="size-4" aria-hidden="true" />} label="View details" onClick={() => run(onView)} />
          {canUpdate ? (
            <MenuAction icon={<Pencil className="size-4" aria-hidden="true" />} label="Edit" disabled={disposed} onClick={() => run(onEdit)} />
          ) : null}
          {canClassify ? (
            <MenuAction icon={<Tags className="size-4" aria-hidden="true" />} label="Classify criticality" disabled={disposed} onClick={() => run(onClassify)} />
          ) : null}
          {canAssignOwner ? (
            <MenuAction icon={<UserRound className="size-4" aria-hidden="true" />} label="Assign owner" disabled={disposed} onClick={() => run(onAssignOwner)} />
          ) : null}
          {canReadHistory ? (
            <MenuAction icon={<History className="size-4" aria-hidden="true" />} label="Change history" onClick={() => run(onHistory)} />
          ) : null}
          {canDelete ? (
            <MenuAction icon={<Trash2 className="size-4" aria-hidden="true" />} label="Delete" className="text-danger hover:bg-danger-soft" onClick={() => run(onDelete)} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  disabled = false,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`flex min-h-9 items-center gap-2 rounded-md px-3 text-left text-sm font-medium hover:bg-neutral-soft disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
