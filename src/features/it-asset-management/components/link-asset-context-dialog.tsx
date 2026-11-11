"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Boxes,
  Building2,
  HardDrive,
  History,
  Info,
  Link2,
  Loader2,
  Radio,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEventSources } from "@/features/event-ingestion";
import { useAssets } from "../hooks/use-assets";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useLinkAssetContext } from "../hooks/use-link-asset-context";
import { useAssetContextHistory } from "../hooks/use-asset-context-history";
import { AssetContextHistory } from "./asset-context-history";
import {
  linkAssetContextSchema,
  type LinkAssetContextInput,
  type LinkAssetContextRequest,
} from "../schemas/link-asset-context-schema";

const defaults: LinkAssetContextInput = {
  businessServiceId: "",
  dependencyIds: [],
  eventSourceIds: [],
};

export function LinkAssetContextDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const hydratedAssetId = useRef<string | null>(null);
  const [tab, setTab] = useState<"links" | "history">("links");
  const history = useAssetContextHistory(assetId, 1);
  const detail = useAssetDetail(assetId);
  const options = useAssetCreateOptions(Boolean(assetId));
  const mutation = useLinkAssetContext(assetId);
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const [cycleMessage, setCycleMessage] = useState<string>();
  const [dependencySearch, setDependencySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chosenDependencies, setChosenDependencies] = useState<
    Array<{ id: string; assetCode: string; name: string; status: string }>
  >([]);
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(dependencySearch.trim()),
      300,
    );
    return () => clearTimeout(timer);
  }, [dependencySearch]);
  const dependencyResults = useAssets(
    {
      page: 1,
      limit: 10,
      status: "active",
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    },
    Boolean(assetId) &&
      tab === "links" &&
      dependencySearch.trim() === debouncedSearch,
  );

  const [sourceSearch, setSourceSearch] = useState("");
  const [debouncedSourceSearch, setDebouncedSourceSearch] = useState("");
  const [chosenSources, setChosenSources] = useState<
    Array<{ id: string; name: string; sourceType: string; status: string }>
  >([]);
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSourceSearch(sourceSearch.trim()),
      300,
    );
    return () => clearTimeout(timer);
  }, [sourceSearch]);
  const sourceResults = useEventSources(
    {
      page: 1,
      limit: 10,
      status: "ACTIVE",
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(debouncedSourceSearch ? { q: debouncedSourceSearch } : {}),
    },
    {
      enabled:
        Boolean(assetId) &&
        tab === "links" &&
        sourceSearch.trim() === debouncedSourceSearch,
    },
  );

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkAssetContextInput, unknown, LinkAssetContextRequest>({
    resolver: zodResolver(linkAssetContextSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (assetId && !ref.current?.open) ref.current?.showModal();
    if (!assetId && ref.current?.open) ref.current.close();
  }, [assetId]);

  useEffect(() => {
    if (!detail.data || !assetId || hydratedAssetId.current === assetId) return;
    reset({
      businessServiceId: detail.data.businessService?.id ?? "",
      dependencyIds: detail.data.dependencies.map((item) => item.asset.id),
      eventSourceIds: detail.data.eventSources.map((item) => item.id),
    });
    hydratedAssetId.current = assetId;
  }, [assetId, detail.data, reset]);

  const close = () => {
    reset(defaults);
    hydratedAssetId.current = null;
    setMessage(undefined);
    setCycleMessage(undefined);
    setTab("links");
    setDependencySearch("");
    setChosenDependencies([]);
    setSourceSearch("");
    setChosenSources([]);
    onClose();
  };

  const submit = async (values: LinkAssetContextRequest) => {
    setMessage(undefined);
    setCycleMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      toast.success(
        "Asset context updated",
        "Business service, dependencies, and event sources are now linked.",
      );
      close();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const cycle = z
          .object({
            error: z.object({
              code: z.literal("ASSET_DEPENDENCY_CYCLE"),
              details: z.object({ path: z.array(z.string()) }).optional(),
            }),
          })
          .safeParse(error.details);
        if (cycle.success) {
          const path = cycle.data.error.details?.path ?? [];
          setCycleMessage(
            `${error.message}${path.length ? ` Circular dependency: ${path.join(" → ")}.` : ""}`,
          );
          return;
        }
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update asset context.",
      );
    }
  };

  const services = [...(options.data?.businessServices ?? [])];
  if (
    detail.data?.businessService &&
    !services.some((item) => item.id === detail.data?.businessService?.id)
  )
    services.push({
      id: detail.data.businessService.id,
      name: `${detail.data.businessService.name} (Inactive - existing link)`,
    });

  const selectedDependencyIds = useWatch({ control, name: "dependencyIds" });
  const dependencyRecords = new Map([
    ...(detail.data?.dependencies ?? []).map(
      (link) => [link.asset.id, link.asset] as const,
    ),
    ...chosenDependencies.map((item) => [item.id, item] as const),
  ]);
  const selectedDependencies = selectedDependencyIds
    .map((id) => dependencyRecords.get(id))
    .filter((item) => item !== undefined);
  const searchPending =
    dependencySearch.trim() !== debouncedSearch ||
    dependencyResults.isFetching ||
    dependencyResults.isPending;
  const matches =
    searchPending || dependencyResults.isError
      ? []
      : (dependencyResults.data?.items ?? []).filter(
          (item) =>
            item.id !== assetId && !selectedDependencyIds.includes(item.id),
        );
  const toggleDependency = (
    item: { id: string; assetCode: string; name: string; status: string },
    selected: boolean,
  ) => {
    if (selected)
      setChosenDependencies((items) => [
        ...items.filter((entry) => entry.id !== item.id),
        item,
      ]);
    setValue(
      "dependencyIds",
      selected
        ? [...selectedDependencyIds, item.id]
        : selectedDependencyIds.filter((id) => id !== item.id),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const selectedSourceIds = useWatch({ control, name: "eventSourceIds" });
  const sourceRecords = new Map([
    ...(detail.data?.eventSources ?? []).map(
      (item) => [item.id, item] as const,
    ),
    ...chosenSources.map((item) => [item.id, item] as const),
  ]);
  const selectedSources = selectedSourceIds
    .map((id) => sourceRecords.get(id))
    .filter((item) => item !== undefined);
  const sourceSearchPending =
    sourceSearch.trim() !== debouncedSourceSearch ||
    sourceResults.isPending ||
    sourceResults.isFetching;
  const sourceMatches =
    sourceSearchPending || sourceResults.isError
      ? []
      : (sourceResults.data?.items ?? [])
          .filter((item) => !selectedSourceIds.includes(item.id))
          .slice(0, 10);
  const toggleSource = (
    item: { id: string; name: string; sourceType: string; status: string },
    selected: boolean,
  ) => {
    if (selected)
      setChosenSources((items) => [
        ...items.filter((entry) => entry.id !== item.id),
        { ...item, status: item.status.toLowerCase() },
      ]);
    setValue(
      "eventSourceIds",
      selected
        ? [...selectedSourceIds, item.id]
        : selectedSourceIds.filter((id) => id !== item.id),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const busy = detail.isPending || options.isPending;
  const isArchived = detail.data?.status !== "active";

  return (
    <Dialog
      title="Link Asset Context"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Asset context views"
        className="border-border bg-surface mb-5 inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs"
      >
        <button
          type="button"
          role="tab"
          id="asset-context-links-tab"
          aria-controls="asset-context-links-panel"
          aria-selected={tab === "links"}
          tabIndex={tab === "links" ? 0 : -1}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
            tab === "links"
              ? "bg-brand text-white shadow-xs"
              : "text-muted hover:text-foreground",
          )}
          onClick={() => setTab("links")}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "links"
                : event.key === "End"
                  ? "history"
                  : "history";
            setTab(next);
            ref.current
              ?.querySelector<HTMLButtonElement>(`#asset-context-${next}-tab`)
              ?.focus();
          }}
        >
          <Link2 className="size-3.5" strokeWidth={2} />
          Link Asset Context
        </button>
        <button
          type="button"
          role="tab"
          id="asset-context-history-tab"
          aria-controls="asset-context-history-panel"
          aria-selected={tab === "history"}
          tabIndex={tab === "history" ? 0 : -1}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
            tab === "history"
              ? "bg-brand text-white shadow-xs"
              : "text-muted hover:text-foreground",
          )}
          onClick={() => setTab("history")}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "links"
                : event.key === "End"
                  ? "history"
                  : "links";
            setTab(next);
            ref.current
              ?.querySelector<HTMLButtonElement>(`#asset-context-${next}-tab`)
              ?.focus();
          }}
        >
          <History className="size-3.5" strokeWidth={2} />
          History
          {history.data ? ` (${history.data.pagination.total})` : ""}
        </button>
      </div>

      {/* History tab panel */}
      <div
        role="tabpanel"
        id="asset-context-history-panel"
        aria-labelledby="asset-context-history-tab"
        hidden={tab !== "history"}
      >
        {tab === "history" && assetId ? (
          <AssetContextHistory key={assetId} assetId={assetId} />
        ) : null}
        <div className="border-border mt-5 flex items-center justify-end border-t pt-4">
          <Button type="button" variant="secondary" onClick={close}>
            Close
          </Button>
        </div>
      </div>

      {/* Links tab panel */}
      <div
        role="tabpanel"
        id="asset-context-links-panel"
        aria-labelledby="asset-context-links-tab"
        hidden={tab !== "links"}
      >
        {busy ? (
          <div
            role="status"
            aria-label="Loading asset context"
            aria-busy="true"
            className="space-y-5"
          >
            <span className="sr-only">Loading asset context…</span>
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ) : detail.isError || options.isError ? (
          <div className="border-border bg-neutral-soft/30 space-y-3 rounded-xl border p-6 text-center">
            <HardDrive
              className="text-muted mx-auto mb-1 size-8"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium">Unable to load relationships</p>
            <p className="text-muted text-xs">
              Reference data could not be fetched. Close the dialog and try
              again.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-1"
              onClick={() => {
                void detail.refetch();
                void options.refetch();
              }}
            >
              Try again
            </Button>
          </div>
        ) : detail.data ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <HardDrive
                className="text-brand size-3.5 shrink-0"
                strokeWidth={1.8}
              />
              <span className="font-semibold tabular-nums">
                {detail.data.assetCode}
              </span>
              <span className="text-muted">·</span>
              <span className="text-muted truncate">{detail.data.name}</span>
            </div>

            {/* Archived warning */}
            {isArchived ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="text-warning mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                />
                <p className="text-xs leading-5">
                  <strong className="text-foreground block">
                    Archived asset
                  </strong>
                  <span className="text-muted">
                    Archived assets cannot be changed. Close this dialog to view
                    the preserved links.
                  </span>
                </p>
              </div>
            ) : null}

            {/* Submit error */}
            {message ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="text-danger mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                />
                <p className="text-danger text-xs leading-5">{message}</p>
              </div>
            ) : null}

            {/* Business service */}
            <div className="space-y-3">
              <div className="border-border flex items-start gap-2 border-b pb-2">
                <Building2
                  className="text-brand mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Business service</h3>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="context-service"
                  className="block text-sm font-medium"
                >
                  Business service
                  <span className="text-muted ml-1 font-normal">
                    (optional)
                  </span>
                </label>
                <Select id="context-service" {...register("businessServiceId")}>
                  <option value="">Unassigned</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                {errors.businessServiceId && (
                  <p role="alert" className="text-danger text-xs">
                    {errors.businessServiceId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Dependencies + Event sources */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Dependencies */}
              <div className="space-y-3">
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <Boxes
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Dependencies</h3>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="dependency-search"
                    className="block text-sm font-medium"
                  >
                    Search dependencies
                  </label>
                  <Input
                    id="dependency-search"
                    type="search"
                    maxLength={100}
                    autoComplete="off"
                    placeholder="Search dependencies"
                    value={dependencySearch}
                    disabled={isArchived || mutation.isPending}
                    aria-describedby="dependency-search-help"
                    onChange={(event) =>
                      setDependencySearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.preventDefault();
                    }}
                  />
                  <p id="dependency-search-help" className="text-muted text-xs">
                    Latest 10 assets. Search by code or name for other assets.
                  </p>
                  <div className="border-border space-y-2 rounded-lg border p-3">
                    <p role="status" className="text-muted text-xs">
                      {searchPending
                        ? "Searching..."
                        : dependencyResults.isError
                          ? "Unable to search. Try again."
                          : matches.length
                            ? "Select from the results."
                            : "No matching assets. Try another search."}
                    </p>
                    {dependencyResults.isError ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void dependencyResults.refetch()}
                      >
                        Retry
                      </Button>
                    ) : null}
                    <ul
                      aria-label="Dependency search results"
                      className="divide-border max-h-56 divide-y overflow-y-auto"
                    >
                      {matches.map((item) => (
                        <li key={item.id}>
                          <label className="flex cursor-pointer gap-2 py-2 text-xs">
                            <input
                              type="checkbox"
                              checked={false}
                              disabled={
                                isArchived ||
                                mutation.isPending ||
                                selectedDependencyIds.length >= 50
                              }
                              onChange={() => toggleDependency(item, true)}
                            />
                            <span className="min-w-0 break-words">
                              <span className="block font-medium">
                                {item.assetCode}
                              </span>
                              {item.name}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm font-medium">
                    Selected dependencies ({selectedDependencyIds.length}/50)
                  </p>
                  <ul
                    aria-label="Selected dependencies"
                    className="border-border divide-border max-h-56 divide-y overflow-y-auto rounded-lg border px-3"
                  >
                    {selectedDependencies.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer gap-2 py-2 text-xs">
                          <input
                            type="checkbox"
                            checked
                            disabled={isArchived || mutation.isPending}
                            onChange={() => toggleDependency(item, false)}
                          />
                          <span className="min-w-0 break-words">
                            <span className="block font-medium">
                              {item.assetCode}
                            </span>
                            {item.name}
                            {item.status !== "active"
                              ? ` (${item.status} - existing link)`
                              : ""}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {!selectedDependencyIds.length ? (
                    <p className="text-muted text-xs">None selected.</p>
                  ) : null}
                </div>
                {cycleMessage ? (
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                    <AlertTriangle
                      className="text-danger mt-0.5 size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    <p className="text-danger text-xs leading-5 break-words">
                      {cycleMessage}
                    </p>
                  </div>
                ) : null}
                {errors.dependencyIds && (
                  <p role="alert" className="text-danger text-xs">
                    {errors.dependencyIds.message}
                  </p>
                )}
                <p className="text-muted text-xs leading-5">
                  Select assets this asset needs to operate. Unchecking removes
                  the link; existing inactive links may be kept.
                </p>
              </div>

              {/* Event sources */}
              <div className="space-y-3">
                <div className="border-border flex items-start gap-2 border-b pb-2">
                  <Radio
                    className="text-brand mt-0.5 size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Event sources</h3>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="event-source-search"
                    className="block text-sm font-medium"
                  >
                    Search event sources
                  </label>
                  <Input
                    id="event-source-search"
                    type="search"
                    maxLength={100}
                    autoComplete="off"
                    placeholder="Search event sources"
                    value={sourceSearch}
                    disabled={isArchived || mutation.isPending}
                    aria-describedby="event-source-search-help"
                    onChange={(event) => setSourceSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.preventDefault();
                    }}
                  />
                  <p
                    id="event-source-search-help"
                    className="text-muted text-xs"
                  >
                    Latest 10 event sources. Search for other sources.
                  </p>
                  <div className="border-border space-y-2 rounded-lg border p-3">
                    <p role="status" className="text-muted text-xs">
                      {sourceSearchPending
                        ? "Searching..."
                        : sourceResults.isError
                          ? "Unable to search. Try again."
                          : sourceMatches.length
                            ? "Select from the results."
                            : "No matching event sources. Try another search."}
                    </p>
                    {sourceResults.isError ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void sourceResults.refetch()}
                      >
                        Retry
                      </Button>
                    ) : null}
                    <ul
                      aria-label="Event source search results"
                      className="divide-border max-h-56 divide-y overflow-y-auto"
                    >
                      {sourceMatches.map((item) => (
                        <li key={item.id}>
                          <label className="flex cursor-pointer gap-2 py-2 text-xs">
                            <input
                              type="checkbox"
                              checked={false}
                              disabled={
                                isArchived ||
                                mutation.isPending ||
                                selectedSourceIds.length >= 50
                              }
                              onChange={() => toggleSource(item, true)}
                            />
                            <span className="min-w-0 break-words">
                              <span className="block font-medium">
                                {item.name}
                              </span>
                              {item.sourceType}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm font-medium">
                    Selected event sources ({selectedSourceIds.length}/50)
                  </p>
                  <ul
                    aria-label="Selected event sources"
                    className="border-border divide-border max-h-56 divide-y overflow-y-auto rounded-lg border px-3"
                  >
                    {selectedSources.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer gap-2 py-2 text-xs">
                          <input
                            type="checkbox"
                            checked
                            disabled={isArchived || mutation.isPending}
                            onChange={() => toggleSource(item, false)}
                          />
                          <span className="min-w-0 break-words">
                            <span className="block font-medium">
                              {item.name}
                            </span>
                            {item.sourceType}
                            {item.status !== "active"
                              ? ` (${item.status} - existing link)`
                              : ""}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {!selectedSourceIds.length ? (
                    <p className="text-muted text-xs">None selected.</p>
                  ) : null}
                </div>
                {errors.eventSourceIds && (
                  <p role="alert" className="text-danger text-xs">
                    {errors.eventSourceIds.message}
                  </p>
                )}
                <p className="text-muted text-xs leading-5">
                  Select sources that produce events for this asset. Unchecking
                  removes the link.
                </p>
              </div>
            </div>

            {/* Info hint */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                className="text-brand mt-0.5 size-4 shrink-0"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Select the operational context used by risk, incident, and
                anomaly workflows. Changes take effect immediately after saving.
              </p>
            </div>

            {/* Footer */}
            <div className="border-border flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || isArchived}
                className={cn(mutation.isPending && "opacity-80")}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2
                      className="mr-1.5 size-3.5 animate-spin"
                      strokeWidth={2}
                    />
                    Saving…
                  </>
                ) : (
                  "Save links"
                )}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </Dialog>
  );
}
