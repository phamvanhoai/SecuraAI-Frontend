"use client";
import { Archive, Ellipsis, Eye, Link2, Pencil, Search, Server, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useAssets } from "../hooks/use-assets";
import {
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
  { key: "type", header: "Type", cell: (item) => item.assetType },
  {
    key: "criticality",
    header: "Criticality",
    cell: (item) => (
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
    cell: (item) => item.dataClassification,
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
      new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
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
  const canRead = session.data?.permissions.includes("assets.read") ?? false;
  const canCreate =
    session.data?.permissions.includes("assets.create") ?? false;
  const canEdit = session.data?.permissions.includes("assets.update") ?? false;
  const assets = useAssets(query, canRead);
  const [search, setSearch] = useState(query.q ?? "");
  const [type, setType] = useState(query.assetType ?? "");
  const [criticality, setCriticality] = useState(query.criticality ?? "");
  const [status, setStatus] = useState(query.status ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
            label={<span className="grid size-6 place-items-center"><span className="sr-only">Actions for {item.assetCode}</span><Ellipsis aria-hidden="true" className="size-5" strokeWidth={1.8} /></span>}
          >
            <Action icon={Eye} label="View details" onClick={() => setSelectedId(item.id)} />
            {canEdit && item.status === "active" ? <Action icon={Pencil} label="Edit asset" onClick={() => setEditingId(item.id)} /> : null}
            {canEdit && item.status === "active" ? <>
              <Action icon={Link2} label="Manage links" onClick={() => setLinkingAssetId(item.id)} />
              <Action icon={ShieldCheck} label="Classify asset" onClick={() => setClassifyingAsset(item)} />
              <Action icon={UserRoundCheck} label="Assign owner" onClick={() => setAssigningAsset(item)} />
              <Action icon={Archive} label="Archive asset" danger onClick={() => setArchivingAsset(item)} />
            </> : null}
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
      assetType: type.trim() || undefined,
      criticality: criticality
        ? (criticality as AssetListQuery["criticality"])
        : undefined,
      status: status ? (status as AssetListQuery["status"]) : undefined,
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
    <div className="space-y-5">
      <ProductPageHeader
        title="IT Asset List"
        description="View the organization’s managed IT assets, ownership, business context, classification, and lifecycle status."
        additionalActions={canCreate ? <CreateAssetDialog /> : undefined}
      />
      <ProductPanel title="Asset directory">
        <form
          aria-label="Asset filters"
          className="border-border grid gap-3 border-b p-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_11rem_auto]"
          onSubmit={submit}
        >
          <label className="text-sm font-medium">
            Search
            <Input
              className="mt-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, name, owner, or service"
            />
          </label>
          <label className="text-sm font-medium">
            Asset type
            <Input
              className="mt-1"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Server, endpoint…"
            />
          </label>
          <label className="text-sm font-medium">
            Criticality
            <Input
              className="mt-1"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
              placeholder="High"
            />
          </label>
          <label className="text-sm font-medium">
            Status
            <Select
              className="mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">
              <Search className="size-4" />
              Filter
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label="Clear filters"
              onClick={() => {
                setSearch("");
                setType("");
                setCriticality("");
                setStatus("");
                router.push("/assets");
              }}
            >
              <X className="size-4" />
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
              <div className="mt-4">
                <Pagination
                  page={assets.data.pagination.page}
                  pageCount={assets.data.pagination.totalPages}
                  onPageChange={(page) => navigate({ page })}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="No assets found"
              description="Adjust the filters or add assets through an implemented asset workflow."
            />
          )}
        </div>
      </ProductPanel>
      <AssetDetailDialog
        assetId={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <EditAssetDialog assetId={editingId} onClose={() => setEditingId(null)} />
      <DeleteAssetDialog asset={archivingAsset} onClose={() => setArchivingAsset(null)} />
      <AssignAssetOwnerDialog asset={assigningAsset} onClose={() => setAssigningAsset(null)} />
      <ClassifyAssetCriticalityDialog asset={classifyingAsset} onClose={() => setClassifyingAsset(null)} />
      <LinkAssetContextDialog assetId={linkingAssetId} onClose={() => setLinkingAssetId(null)} />
    </div>
  );
}

function Action({ icon: Icon, label, onClick, danger = false }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) {
  return <button className={`${danger ? "text-danger hover:bg-danger-soft" : "hover:bg-neutral-soft"} focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2`} onClick={onClick} type="button"><Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />{label}</button>;
}
