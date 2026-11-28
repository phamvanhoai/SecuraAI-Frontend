"use client";
import { Archive, Ellipsis, Eye, Link2, Pencil, Search, Server, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useAssets } from "../hooks/use-assets";
import { assetTypes, assetTypeLabels, assetTypeLabel, assetTypeSchema } from "../schemas/asset-type-schema";
import {
  assetCriticalities,
  assetListQuerySchema,
  type AssetListItem,
  type AssetListQuery,
} from "../schemas/asset-list-schema";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { CreateAssetDialog } from "./create-asset-dialog";
import { EditAssetDialog } from "./edit-asset-dialog";
import { DeleteAssetDialog } from "./delete-asset-dialog";
import { AssignAssetOwnerDialog } from "./assign-asset-owner-dialog";
import { ClassifyAssetCriticalityDialog } from "./classify-asset-criticality-dialog";
import { LinkAssetContextDialog } from "./link-asset-context-dialog";
import { AssetManagementTabs } from "./asset-management-tabs";
const columns: readonly DataTableColumn<AssetListItem>[] = [
  {
    key: "asset",
    header: "Asset",
    cell: (item) => (
      <span className="flex min-w-56 items-center gap-3">
        <span className="bg-neutral-soft text-brand grid size-9 place-items-center rounded-lg">
          <Server className="size-4" aria-hidden="true" />
        </span>
        <span>
          <strong className="block">{item.name}</strong>
          <span className="text-muted text-xs">{item.assetCode}</span>
        </span>
      </span>
    ),
  },
  { key: "type", header: "Type", cell: (item) => assetTypeLabel(item.assetType) },
  {
    key: "criticality",
    header: "Criticality",
    cell: (item) => item.criticality === null ? "-" : (
      <StatusBadge
        tone={
          item.criticality.toLowerCase() === "critical"
            ? "danger"
            : item.criticality.toLowerCase() === "high"
              ? "warning"
              : "neutral"
        }
      >
        {item.criticality}
      </StatusBadge>
    ),
  },
  {
    key: "classification",
    header: "Data classification",
    cell: (item) => item.dataClassification ?? "-",
  },
  {
    key: "service",
    header: "Business service",
    cell: (item) =>
      item.businessService?.name ?? (
        <span className="text-muted">Unassigned</span>
      ),
  },
  {
    key: "owner",
    header: "Owner",
    cell: (item) =>
      item.owner?.fullName ?? <span className="text-muted">Unassigned</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (item) => (
      <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
        {item.status}
      </StatusBadge>
    ),
  },
  {
    key: "updated",
    header: "Updated",
    cell: (item) =>
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(item.updatedAt),
      ),
  },
];
function parse(parameters: URLSearchParams): AssetListQuery {
  const result = assetListQuerySchema.safeParse(
    Object.fromEntries(parameters.entries()),
  );
  return result.success ? result.data : assetListQuerySchema.parse({});
}
export function AssetsShell() {
  const router = useRouter();
  const parameters = useSearchParams();
  const query = useMemo(() => parse(parameters), [parameters]);
  const session = useSessionUser();
  const isEmployee = session.data?.roles?.some((role) => role.code === "EMPLOYEE") ?? false;
  const canRead = session.data?.permissions.includes("assets.read") ?? false;
  const canCreate =
    session.data?.permissions.includes("assets.create") ?? false;
  const canEdit = session.data?.permissions.includes("assets.update") ?? false;
  const assets = useAssets(query, canRead);
  const [search, setSearch] = useState(query.q ?? "");
  const hasActiveFilters = Boolean(
    query.q || query.assetType || query.criticality || query.status,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archivingAsset, setArchivingAsset] = useState<AssetListItem | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<AssetListItem | null>(null);
  const [classifyingAsset, setClassifyingAsset] = useState<AssetListItem | null>(null);
  const [linkingAssetId, setLinkingAssetId] = useState<string | null>(null);
  const tableColumns = useMemo<readonly DataTableColumn<AssetListItem>[]>(
    () => [
      ...columns,
      {
        key: "actions",
        header: "Actions",
        cell: (item) => (
          <DropdownMenu
            className="w-fit"
            data-asset-actions={item.id}
            label={<span className="grid size-6 place-items-center"><span className="sr-only">Actions for {item.assetCode}</span><Ellipsis aria-hidden="true" className="size-5" strokeWidth={1.8} /></span>}
          >
            <Action icon={Eye} label="View details" onClick={() => {
              detailTrigger.current = document.querySelector<HTMLElement>(`[data-asset-actions="${item.id}"] summary`);
              setSelectedId(item.id);
            }} />
            {canEdit && item.status === "active" ? <Action icon={Pencil} label="Edit asset" onClick={() => setEditingId(item.id)} /> : null}
            {canEdit && item.status === "active" ? <>
              <Action icon={Link2} label="Manage links" onClick={() => setLinkingAssetId(item.id)} />
              <Action icon={ShieldCheck} label="Classify asset" onClick={() => setClassifyingAsset(item)} />
              <Action icon={UserRoundCheck} label="Assign owner" onClick={() => setAssigningAsset(item)} />
              <Action icon={Archive} label="Archive asset" danger onClick={() => setArchivingAsset(item)} />
            </> : null}
            {canEdit && item.status === "archived" ? <Action icon={ShieldCheck} label="Classification history" onClick={() => setClassifyingAsset(item)} /> : null}
          </DropdownMenu>
        ),
      },
    ],
    [canEdit],
  );
  const navigate = (next: Partial<AssetListQuery>) => {
    const searchParams = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        searchParams.set(key, String(value));
    });
    router.push(`/assets?${searchParams.toString()}`);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate({
      page: 1,
      q: search.trim() || undefined,
    });
  };
  if (session.isPending) return <TableSkeleton rows={8} columns={8} />;
  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have permission to view assets
        </strong>
        <span>
          Security Officer or assigned Asset Owner access is required.
        </span>
      </Alert>
    );
  return (
    <>
      <ProductPageHeader
        title="IT Asset List"
        description="View the organization’s managed IT assets, ownership, business context, classification, and lifecycle status."
        additionalActions={canCreate ? <CreateAssetDialog onCreated={() => navigate({ page: 1, sortBy: "createdAt", sortOrder: "desc" })} /> : undefined}
      />
      <AssetManagementTabs active="assets" canReadServices={session.data?.permissions.includes("business-services.read") ?? false} />
      <ProductPanel
        title="Asset directory"
        description={assets.data ? `${assets.data.pagination.total} assets found` : "Managed IT assets within your access scope"}
      >
        <form
          aria-label="Asset filters"
          className="border-border grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_10rem_10rem_9rem_auto]"
          onSubmit={submit}
        >
          <label className="min-w-0 text-sm font-medium">
            Search
            <Input
              className="mt-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, name, owner, or service"
            />
          </label>
          <label className="min-w-0 text-sm font-medium">
            Asset type
            <Select className="mt-1" value={query.assetType ?? ""} onChange={(e) => navigate({ page: 1, assetType: assetTypeSchema.safeParse(e.target.value).data })}>
              <option value="">All types</option>
              {assetTypes.map((value) => <option key={value} value={value}>{assetTypeLabels[value]}</option>)}
            </Select>
          </label>
          <label className="min-w-0 text-sm font-medium">
            Criticality
            <Select className="mt-1" value={query.criticality ?? ""} onChange={(e) => navigate({ page: 1, criticality: e.target.value ? e.target.value as AssetListQuery["criticality"] : undefined })}>
              <option value="">All criticalities</option>
              {assetCriticalities.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
            </Select>
          </label>
          <label className="min-w-0 text-sm font-medium">
            Status
            <Select className="mt-1" value={query.status ?? ""} onChange={(e) => navigate({ page: 1, status: e.target.value ? e.target.value as AssetListQuery["status"] : undefined })}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">
              <Search aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label="Clear filters"
              onClick={() => {
                setSearch("");
                router.push("/assets");
              }}
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
        </form>
        <div className="p-4">
          {assets.isPending ? (
            <TableSkeleton rows={8} columns={8} />
          ) : assets.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              <strong className="block">Unable to load asset list</strong>
              <span>Check the backend connection and try again.</span>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => void assets.refetch()}
              >
                Try again
              </Button>
            </Alert>
          ) : assets.data?.items.length ? (
            <>
              <DataTable
                columns={tableColumns}
                rows={assets.data.items}
                getRowKey={(item) => item.id}
              />
            </>
          ) : (
            <div className="py-12 text-center">
              <Server
                aria-hidden="true"
                className="text-muted mx-auto size-10 stroke-1"
              />
              <h3 className="mt-2 text-base font-semibold">
                {hasActiveFilters
                  ? "No matching assets found"
                  : isEmployee ? "No assets assigned" : "No assets found"}
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                {hasActiveFilters
                  ? "No assets match the current search and filter criteria. Try adjusting or clearing the filters."
                  : isEmployee ? "You haven’t been assigned any assets yet." : "No IT assets have been registered yet."}
              </p>
              {hasActiveFilters ? (
                <Button
                  className="mt-4 min-h-9 text-xs"
                  onClick={() => {
                    setSearch("");
                    router.push("/assets");
                  }}
                  type="button"
                  variant="secondary"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
        {assets.data && assets.data.items.length > 0 ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={assets.data.pagination.page}
              pageCount={assets.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </ProductPanel>
      <AssetDetailDialog
        assetId={selectedId}
        onClose={() => {
          setSelectedId(null);
          detailTrigger.current?.focus();
        }}
      />
      <EditAssetDialog assetId={editingId} onClose={() => setEditingId(null)} />
      <DeleteAssetDialog asset={archivingAsset} onClose={() => setArchivingAsset(null)} />
      <AssignAssetOwnerDialog asset={assigningAsset} onClose={() => setAssigningAsset(null)} />
      <ClassifyAssetCriticalityDialog asset={classifyingAsset} onClose={() => setClassifyingAsset(null)} />
      <LinkAssetContextDialog assetId={linkingAssetId} onClose={() => setLinkingAssetId(null)} />
    </>
  );
}

function Action({ icon: Icon, label, onClick, danger = false }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) {
  return <button className={`${danger ? "text-danger hover:bg-danger-soft" : "hover:bg-neutral-soft"} focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2`} onClick={onClick} type="button"><Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />{label}</button>;
}
