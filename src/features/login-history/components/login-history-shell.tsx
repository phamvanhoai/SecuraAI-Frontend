"use client";

import { Filter, RefreshCw, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  MetricStrip,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { ApiError } from "@/lib/api/api-error";
import { useLoginHistory } from "../hooks/use-login-history";
import { canViewLoginHistory } from "../lib/access";
import {
  loginHistoryQuerySchema,
  type LoginHistoryItem,
  type LoginHistoryQuery,
} from "../schemas/login-history-schema";

const initialFilters = {
  search: "",
  status: "",
  from: "",
  to: "",
  ipAddress: "",
  limit: "20",
  sortOrder: "desc",
};
const failureLabels: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: "Incorrect email or password",
  ACCOUNT_INACTIVE: "Account is inactive",
};
const columns: readonly DataTableColumn<LoginHistoryItem>[] = [
  {
    key: "user",
    header: "User / Email",
    cell: (item) => (
      <div className="min-w-44">
        <p className="font-medium">{item.userName ?? "Unknown"}</p>
        <p className="text-muted mt-1 text-xs break-all">{item.email}</p>
      </div>
    ),
  },
  {
    key: "time",
    header: "Login time",
    cell: (item) => (
      <time
        className="whitespace-nowrap tabular-nums"
        dateTime={item.loginTime}
      >
        {new Date(item.loginTime).toLocaleString("en-GB")}
      </time>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (item) => (
      <StatusBadge tone={item.status === "success" ? "success" : "danger"}>
        {item.status === "success" ? "Success" : "Failed"}
      </StatusBadge>
    ),
  },
  {
    key: "ip",
    header: "IP address",
    cell: (item) => (
      <span className="font-mono text-xs">{item.ipAddress ?? "—"}</span>
    ),
  },
  {
    key: "reason",
    header: "Failure reason",
    cell: (item) =>
      item.failureReason
        ? (failureLabels[item.failureReason] ?? "Login denied")
        : "—",
  },
  {
    key: "agent",
    header: "Browser / Device",
    cell: (item) => (
      <p className="text-muted max-w-64 text-xs break-words">
        {item.userAgent ?? "Unknown"}
      </p>
    ),
  },
];

export function LoginHistoryShell() {
  const router = useRouter();
  const session = useSessionUser();
  const allowed = canViewLoginHistory(session.data);
  const isEmployee =
    session.data?.roles.some((role) => role.code === "EMPLOYEE") ?? false;
  const [query, setQuery] = useState<LoginHistoryQuery>(() =>
    loginHistoryQuerySchema.parse({}),
  );
  const [filters, setFilters] = useState(initialFilters);
  const [scope, setScope] = useState<"organization" | "mine">("organization");
  const [advanced, setAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const history = useLoginHistory(query, session.isSuccess && allowed);
  const denied =
    history.error instanceof ApiError && history.error.status === 403;
  const expired =
    history.error instanceof ApiError && history.error.status === 401;

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data || expired)
      router.replace("/login?returnUrl=%2Flogin-history");
    else if (!allowed || denied) router.replace("/forbidden");
  }, [allowed, denied, expired, router, session.data, session.isPending]);

  if (session.isPending || !session.data || !allowed || denied || expired)
    return <DashboardLoadingSkeleton variant="table" />;

  function updateFilter(key: keyof typeof initialFilters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setErrors((previous) => ({ ...previous, [key]: "" }));
    if (key !== "search" && key !== "ipAddress") applyFilters(next);
  }
  function applyFilters(filters: typeof initialFilters) {
    const invalidDates: Record<string, string> = {};
    for (const key of ["from", "to"] as const) {
      if (filters[key] && !Number.isFinite(new Date(filters[key]).getTime()))
        invalidDates[key] = "Enter a valid date and time.";
    }
    if (Object.keys(invalidDates).length) {
      setErrors(invalidDates);
      return;
    }
    const parsed = loginHistoryQuerySchema.safeParse({
      page: 1,
      limit: filters.limit,
      sortOrder: filters.sortOrder,
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(isEmployee || scope === "mine" ? { userId: session.data?.id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.ipAddress.trim()
        ? { ipAddress: filters.ipAddress.trim() }
        : {}),
      ...(filters.from ? { from: new Date(filters.from).toISOString() } : {}),
      ...(filters.to ? { to: new Date(filters.to).toISOString() } : {}),
    });
    if (!parsed.success) {
      const messages: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        messages[key] =
          key === "ipAddress"
            ? "Enter a valid IPv4 or IPv6 address."
            : key === "userId"
              ? "Enter a valid user UUID."
              : key === "to"
                ? "End time must be on or after start time."
                : "Invalid filter value.";
      }
      setErrors(messages);
      return;
    }
    setErrors({});
    setQuery(parsed.data);
  }
  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(filters);
  }
  function reset() {
    setFilters(initialFilters);
    setErrors({});
    setQuery(loginHistoryQuerySchema.parse({}));
  }
  function changeScope(nextScope: "organization" | "mine") {
    setScope(nextScope);
    const nextQuery = loginHistoryQuerySchema.safeParse({
      ...query,
      page: 1,
      ...(nextScope === "mine" ? { userId: session.data?.id } : { userId: undefined }),
    });
    if (nextQuery.success) setQuery(nextQuery.data);
  }
  const fields = [
    { key: "from", label: "From", type: "datetime-local" },
    { key: "to", label: "To", type: "datetime-local" },
    { key: "ipAddress", label: "IP address", type: "text" },
  ] as const;
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.from,
    filters.to,
    filters.ipAddress,
  ].filter(Boolean).length;
  const pageItems = history.data?.items ?? [];
  const successfulOnPage = pageItems.filter(
    (item) => item.status === "success",
  ).length;
  const failedOnPage = pageItems.length - successfulOnPage;
  const uniqueAccountsOnPage = new Set(
    pageItems.map((item) => item.userId ?? item.email),
  ).size;

  return (
    <>
      <ProductPageHeader
        title="Login history"
        description={
          isEmployee
            ? "Review your recent successful and failed sign-in activity."
            : "Review authentication activity across the organization and investigate unusual sign-in patterns."
        }
        showSampleNotice={false}
        additionalActions={
          <Button
            variant="secondary"
            type="button"
            disabled={history.isFetching}
            onClick={() => void history.refetch()}
          >
            <RefreshCw
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
            {history.isFetching ? "Loading…" : "Refresh"}
          </Button>
        }
      />
      <MetricStrip
        ariaLabel="Login history metrics"
        metrics={[
          {
            label: "Total sessions",
            value: history.data ? String(history.data.pagination.total) : "—",
            detail: "Recorded authentication sessions",
            tone: "brand",
            loading: history.isPending,
          },
          {
            label: "Successful",
            value: history.data ? String(successfulOnPage) : "—",
            detail: "On this page",
            tone: "neutral",
            loading: history.isPending,
          },
          {
            label: "Failed",
            value: history.data ? String(failedOnPage) : "—",
            detail: "On this page",
            tone: failedOnPage > 0 ? "danger" : "neutral",
            loading: history.isPending,
          },
          {
            label: "Accounts",
            value: history.data ? String(uniqueAccountsOnPage) : "—",
            detail: "Unique accounts on this page",
            tone: "neutral",
            loading: history.isPending,
          },
        ]}
      />
      {!isEmployee ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="border-border bg-surface inline-flex items-center gap-1 rounded-xl border p-1 shadow-xs" role="tablist" aria-label="Login history scope">
            {(["organization", "mine"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={scope === tab}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${scope === tab ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
                onClick={() => changeScope(tab)}
              >
                <span>{tab === "organization" ? "Organization" : "My activity"}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <ProductPanel
        title="Login history"
        description={
          history.data
            ? `${history.data.pagination.total} login attempts found`
            : "Each row is a login attempt. Times use your device’s time zone."
        }
      >
        <form
          className="border-border space-y-3 border-b p-4"
          onSubmit={submitFilters}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block max-w-md min-w-[220px] flex-1">
              <span className="sr-only">Search by name or email</span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <Input
                className="bg-background min-h-10 pl-9"
                id="login-search"
                value={filters.search}
                maxLength={255}
                placeholder="Search by name or email"
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </label>
            <Button className="min-h-10" type="submit">
              Search
            </Button>
            <Select
              aria-label="Status"
              className="min-h-10 w-40"
              id="login-status"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </Select>
            <Select
              aria-label="Sort login history"
              className="min-h-10 w-40"
              id="login-order"
              value={filters.sortOrder}
              onChange={(event) =>
                updateFilter("sortOrder", event.target.value)
              }
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Select>
            <Button
              className="min-h-10"
              type="button"
              variant={advanced ? "primary" : "secondary"}
              onClick={() => setAdvanced((value) => !value)}
            >
              <Filter aria-hidden="true" className="size-4" />
              Advanced
              {activeFilterCount ? (
                <span className="bg-brand-soft text-brand rounded-full px-1.5 text-xs">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            {activeFilterCount ? (
              <Button
                aria-label="Reset"
                className="min-h-10 gap-1.5"
                variant="secondary"
                type="button"
                onClick={reset}
              >
                <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Clear
              </Button>
            ) : null}
          </div>
          {advanced ? (
            <div className="border-border bg-neutral-soft/20 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <FormField
                  key={field.key}
                  id={`login-${field.key}`}
                  label={field.label}
                  error={errors[field.key]}
                >
                  <Input
                    id={`login-${field.key}`}
                    className={
                      field.type === "datetime-local"
                        ? "dark:[color-scheme:dark]"
                        : undefined
                    }
                    type={field.type}
                    value={filters[field.key]}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={
                      errors[field.key] ? `login-${field.key}-error` : undefined
                    }
                    maxLength={field.type === "text" ? 45 : undefined}
                    onChange={(event) =>
                      updateFilter(field.key, event.target.value)
                    }
                  />
                </FormField>
              ))}
            </div>
          ) : null}
        </form>
        <div className="p-4">
          {history.isPending ? (
            <TableSkeleton
              headers={[
                "User / Email",
                "Login time",
                "Status",
                "IP address",
                "Failure reason",
                "Browser / Device",
              ]}
              rows={6}
              label="Loading login history"
            />
          ) : history.isError ? (
            <div className="space-y-3">
              <Alert>Unable to load login history. Please try again.</Alert>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void history.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : history.data.items.length === 0 ? (
            <EmptyState
              title={
                activeFilterCount
                  ? "No matching login history"
                  : "No login history recorded"
              }
              description={
                activeFilterCount
                  ? "Adjust or clear the filters to broaden the results."
                  : "Login attempts will appear here after authentication activity is recorded."
              }
            />
          ) : (
            <div
              aria-label="Login history results"
              className="[&_table]:min-w-[960px]"
            >
              <DataTable
                columns={columns}
                rows={history.data.items}
                getRowKey={(item) => item.id}
              />
            </div>
          )}
        </div>
        {history.data && !history.isError ? (
          <div className="border-border border-t p-4">
            <div className="mb-3 max-w-40">
              <FormField id="login-limit" label="Rows per page">
                <Select
                  id="login-limit"
                  value={filters.limit}
                  onChange={(event) => {
                    updateFilter("limit", event.target.value);
                  }}
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </FormField>
            </div>
            <Pagination
              page={history.data.pagination.page}
              pageCount={history.data.pagination.totalPages}
              onPageChange={(page) =>
                setQuery((previous) => ({ ...previous, page }))
              }
            />
          </div>
        ) : null}
      </ProductPanel>
    </>
  );
}
