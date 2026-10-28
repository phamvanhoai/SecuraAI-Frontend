"use client";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CircleOff,
  Ellipsis,
  Eye,
  Pencil,
  Search,
  X,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useSessionUser } from "@/features/authentication-account";
import { useBusinessServices } from "../hooks/use-business-services";
import {
  businessServiceListQuerySchema,
  type BusinessService,
  type BusinessServiceListQuery,
} from "../schemas/business-service-schema";
import { AssetManagementTabs } from "./asset-management-tabs";
import { BusinessServiceDetailDialog } from "./business-service-detail-dialog";
import { BusinessServiceError } from "./business-service-feedback";
import { CreateBusinessServiceDialog } from "./create-business-service-dialog";
import { EditBusinessServiceDialog } from "./edit-business-service-dialog";
import { DeactivateBusinessServiceDialog } from "./deactivate-business-service-dialog";

export function BusinessServicesShell() {
  const router = useRouter();
  const parameters = useSearchParams();
  const parsed = useMemo(
    () => businessServiceListQuerySchema.safeParse(Object.fromEntries(parameters)),
    [parameters],
  );
  const query = parsed.success
    ? parsed.data
    : businessServiceListQuerySchema.parse({});

  const session = useSessionUser();
  const canRead =
    session.data?.permissions.includes("business-services.read") ?? false;

  const services = useBusinessServices(
    query,
    canRead && parsed.success && !session.isPending && !session.isError,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const navigate = (next: Partial<BusinessServiceListQuery>) => {
    const values = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined) values.set(key, String(value));
    });
    router.push(`/assets/business-services?${values}`);
  };

  // Derived metrics
  const total = services.data?.pagination.total ?? 0;
  const activeCount =
    services.data?.items.filter((s) => s.status === "active").length ?? 0;
  const withOwner =
    services.data?.items.filter((s) => s.owner && !s.owner.inactive).length ?? 0;

  const columns: readonly DataTableColumn<BusinessService>[] = [
    {
      key: "name",
      header: "Business service",
      cell: (item) => (
        <div className="py-0.5">
          <strong className="text-foreground block font-medium max-w-sm break-words">
            {item.name}
          </strong>
          {item.description ? (
            <span className="text-muted mt-0.5 line-clamp-1 text-xs">
              {item.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "owner",
      header: "Responsible owner",
      cell: (item) => (
        <span className="text-sm break-words">
          {item.owner?.fullName ?? (
            <span className="text-muted">Unassigned</span>
          )}
          {item.owner?.inactive ? (
            <span className="text-muted ml-1 text-xs">(Inactive)</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "assets",
      header: "Linked assets",
      cell: (item) => (
        <span className="tabular-nums text-sm">{item.linkedAssetsCount}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
          {item.status === "active" ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <DropdownMenu
          className="w-fit"
          data-service-actions={item.id}
          label={
            <span className="grid size-6 place-items-center">
              <span className="sr-only">Actions for {item.name}</span>
              <Ellipsis aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
          }
        >
          <button
            type="button"
            className="hover:bg-background focus-visible:outline-brand flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2"
            aria-label={`View details for ${item.name}`}
            onClick={() => {
              trigger.current = document.querySelector<HTMLElement>(
                `[data-service-actions="${item.id}"] summary`,
              );
              setSelectedId(item.id);
            }}
          >
            <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
            View details
          </button>
          {item.status === "active" &&
          session.data?.permissions.includes("business-services.update") ? (
            <button
              type="button"
              className="hover:bg-background focus-visible:outline-brand flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2"
              aria-label={`Edit ${item.name}`}
              onClick={() => {
                trigger.current = document.querySelector<HTMLElement>(
                  `[data-service-actions="${item.id}"] summary`,
                );
                setEditingId(item.id);
              }}
            >
              <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Edit
            </button>
          ) : null}
          {item.status === "active" &&
          session.data?.permissions.includes("business-services.deactivate") ? (
            <button
              type="button"
              aria-label={`Deactivate ${item.name}`}
              className="text-danger hover:bg-danger/10 focus-visible:outline-brand border-border mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border-t px-3 py-2 text-left text-sm focus-visible:outline-2"
              onClick={() => {
                trigger.current = document.querySelector<HTMLElement>(
                  `[data-service-actions="${item.id}"] summary`,
                );
                setDeactivatingId(item.id);
              }}
            >
              <CircleOff aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Deactivate
            </button>
          ) : null}
        </DropdownMenu>
      ),
    },
  ];

  if (session.isPending)
    return (
      <TableSkeleton
        headers={[
          "Business service",
          "Responsible owner",
          "Linked assets",
          "Status",
          "Actions",
        ]}
        label="Loading business services"
        rows={5}
      />
    );

  if (session.isError)
    return (
      <Alert>
        Unable to verify your access.{" "}
        <Button variant="secondary" onClick={() => void session.refetch()}>
          Try again
        </Button>
      </Alert>
    );

  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have permission to view business services
        </strong>
        Security Officer access is required.
      </Alert>
    );

  return (
    <>
      <ProductPageHeader
        title="Business Services"
        description="Review the business services that provide context for assets and risks."
        {...(session.data?.permissions.includes("business-services.create")
          ? {
              additionalActions: (
                <CreateBusinessServiceDialog
                  onCreated={(service) => {
                    router.push("/assets/business-services");
                    setSelectedId(service.id);
                  }}
                />
              ),
            }
          : {})}
      />

      <MetricStrip
        ariaLabel="Business service metrics"
        metrics={[
          {
            label: "Total services",
            value: services.data ? String(total) : "\u2014",
            detail: "Matching current filters",
            tone: "brand",
            loading: services.isPending,
          },
          {
            label: "Active",
            value: services.data ? String(activeCount) : "\u2014",
            detail: "On this page",
            tone: "neutral",
            loading: services.isPending,
          },
          {
            label: "With owner",
            value: services.data ? String(withOwner) : "\u2014",
            detail: "Active owner on this page",
            tone: "neutral",
            loading: services.isPending,
          },
          {
            label: "Unassigned",
            value: services.data
              ? String((services.data?.items.length ?? 0) - withOwner)
              : "\u2014",
            detail: "No active owner on this page",
            tone: (services.data?.items.length ?? 0) - withOwner > 0 ? "warning" : "neutral",
            loading: services.isPending,
          },
        ]}
      />

      <AssetManagementTabs active="services" canReadServices={canRead} />

      <ProductPanel
        title="Business service directory"
        description={
          services.data
            ? `${services.data.pagination.total} service${services.data.pagination.total === 1 ? "" : "s"} found`
            : "All configured business services"
        }
      >
        <ServiceFilters
          key={parameters.toString()}
          query={query}
          onApply={navigate}
          onClear={() => router.push("/assets/business-services")}
        />

        <div className="p-4">
          {!parsed.success ? (
            <Alert>
              Invalid filters.{" "}
              <Button
                variant="secondary"
                onClick={() => router.push("/assets/business-services")}
              >
                Clear filters
              </Button>
            </Alert>
          ) : services.isPending ? (
            <TableSkeleton
              headers={[
                "Business service",
                "Responsible owner",
                "Linked assets",
                "Status",
                "Actions",
              ]}
              label="Loading business services"
              rows={5}
            />
          ) : services.isError ? (
            <BusinessServiceError
              error={services.error}
              onRetry={() => void services.refetch()}
            />
          ) : services.data?.items.length ? (
            <DataTable
              columns={columns}
              rows={services.data.items}
              getRowKey={(item) => item.id}
            />
          ) : (
            <div className="py-12 text-center">
              <Building2 className="text-muted mx-auto size-10 stroke-1" />
              <h4 className="mt-2 text-base font-semibold">
                No business services found
              </h4>
              <p className="text-muted mt-1 text-sm">
                {query.q || query.status
                  ? "Adjust the search or clear the status filter."
                  : query.page > 1
                    ? "The list may have changed. Return to the first page."
                    : "No business services have been configured. Use Create business service if you have permission."}
              </p>
              {query.page > 1 ? (
                <Button
                  className="mt-4 min-h-9 gap-2 text-xs"
                  variant="secondary"
                  onClick={() => navigate({ page: 1 })}
                >
                  First page
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {services.data && services.data.items.length > 0 ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={services.data.pagination.page}
              pageCount={services.data.pagination.totalPages}
              onPageChange={(page) => navigate({ page })}
            />
          </div>
        ) : null}
      </ProductPanel>

      {deactivatingId ? (
        <DeactivateBusinessServiceDialog
          key={deactivatingId}
          serviceId={deactivatingId}
          onClose={() => {
            setDeactivatingId(null);
            trigger.current?.focus();
          }}
        />
      ) : null}
      {editingId ? (
        <EditBusinessServiceDialog
          key={editingId}
          serviceId={editingId}
          onClose={() => {
            setEditingId(null);
            trigger.current?.focus();
          }}
        />
      ) : null}
      {selectedId && !services.isError ? (
        <BusinessServiceDetailDialog
          key={selectedId}
          serviceId={selectedId}
          enabled={canRead}
          onClose={() => {
            setSelectedId(null);
            trigger.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}

function ServiceFilters({
  query,
  onApply,
  onClear,
}: {
  query: BusinessServiceListQuery;
  onApply: (next: Partial<BusinessServiceListQuery>) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState(query.q ?? "");
  const [status, setStatus] = useState(query.status ?? "");
  const isFiltered = Boolean(query.q || query.status);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply({
      page: 1,
      q: search.trim() || undefined,
      status: status === "active" || status === "inactive" ? status : undefined,
    });
  };

  return (
    <form
      aria-label="Business service filters"
      onSubmit={submit}
      className="border-border flex flex-wrap items-center gap-2 border-b p-4"
    >
      <label className="relative block min-w-[220px] max-w-md flex-1">
        <span className="sr-only">Search</span>
        <Search
          aria-hidden="true"
          className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <Input
          className="bg-background min-h-10 pl-9"
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, description, or owner"
          value={search}
        />
      </label>
      <Select
        aria-label="Status"
        className="min-h-10 w-36"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
      <Button className="min-h-10" type="submit">
        Search
      </Button>
      {isFiltered ? (
        <Button
          className="min-h-10 gap-1.5"
          onClick={onClear}
          aria-label="Clear filters"
          type="button"
          variant="secondary"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Clear
        </Button>
      ) : null}
    </form>
  );
}
