"use client";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleOff, Ellipsis, Eye, Pencil, Search, X } from "lucide-react";
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
    () =>
      businessServiceListQuerySchema.safeParse(Object.fromEntries(parameters)),
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
  const columns: readonly DataTableColumn<BusinessService>[] = [
    {
      key: "name",
      header: "Business service",
      cell: (item) => (
        <strong className="block max-w-sm min-w-44 break-words">
          {item.name}
        </strong>
      ),
    },
    {
      key: "owner",
      header: "Responsible owner",
      cell: (item) => (
        <span className="break-words">
          {item.owner?.fullName ?? "Unassigned"}
          {item.owner?.inactive ? " (Inactive)" : ""}
        </span>
      ),
    },
    {
      key: "assets",
      header: "Linked assets",
      cell: (item) => (
        <span className="tabular-nums">{item.linkedAssetsCount}</span>
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
              <Ellipsis
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
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
              <CircleOff
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Deactivate
            </button>
          ) : null}
        </DropdownMenu>
      ),
    },
  ];
  if (session.isPending) return <TableSkeleton rows={5} columns={5} />;
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
    <div className="space-y-5">
      <ProductPageHeader
        title="Business Services"
        description="Review the business services that provide context for assets and risks."
        additionalActions={
          session.data?.permissions.includes("business-services.create") ? (
            <CreateBusinessServiceDialog
              onCreated={(service) => {
                router.push("/assets/business-services");
                setSelectedId(service.id);
              }}
            />
          ) : undefined
        }
      />
      <AssetManagementTabs active="services" canReadServices={canRead} />
      <ProductPanel title="Business service directory">
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
            <TableSkeleton rows={5} columns={5} />
          ) : services.isError ? (
            <BusinessServiceError
              error={services.error}
              onRetry={() => void services.refetch()}
            />
          ) : services.data?.items.length ? (
            <>
              <p className="text-muted mb-3 text-sm">
                {services.data.pagination.total} services found · Asset counts
                include all statuses.
              </p>
              <DataTable
                columns={columns}
                rows={services.data.items}
                getRowKey={(item) => item.id}
              />
              <div className="mt-4">
                <Pagination
                  page={services.data.pagination.page}
                  pageCount={services.data.pagination.totalPages}
                  onPageChange={(page) => navigate({ page })}
                />
              </div>
            </>
          ) : (
            <>
              <EmptyState
                title="No business services found"
                description={
                  query.q || query.status
                    ? "Adjust the search or clear the status filter."
                    : query.page > 1
                      ? "The list may have changed. Return to the first page."
                      : "No business services have been configured. Use Create business service if you have permission."
                }
              />
              {query.page > 1 ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate({ page: 1 })}
                >
                  First page
                </Button>
              ) : null}
            </>
          )}
        </div>
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
    </div>
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
      className="border-border grid gap-3 border-b p-4 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
    >
      <label className="text-sm font-medium">
        Search
        <Input
          className="mt-1"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, description, or owner"
        />
      </label>
      <label className="text-sm font-medium">
        Status
        <Select
          className="mt-1"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit">
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
        <Button
          type="button"
          variant="secondary"
          aria-label="Clear filters"
          onClick={onClear}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
