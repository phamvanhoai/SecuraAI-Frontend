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
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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

  const {
    register,
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
        error instanceof Error ? error.message : "Unable to update asset context.",
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

  const dependencies = (options.data?.assets ?? [])
    .filter((item) => item.id !== assetId)
    .map((item) => ({ ...item, status: "active" }));
  for (const link of detail.data?.dependencies ?? []) {
    if (!dependencies.some((item) => item.id === link.asset.id))
      dependencies.push(link.asset);
  }

  const sources = (options.data?.eventSources ?? []).map((item) => ({
    ...item,
    status: "active",
  }));
  for (const source of detail.data?.eventSources ?? []) {
    if (!sources.some((item) => item.id === source.id)) sources.push(source);
  }

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
        <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
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
          <div className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center space-y-3">
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
                className="size-3.5 shrink-0 text-brand"
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
                  className="mt-0.5 size-4 shrink-0 text-warning"
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
                  className="mt-0.5 size-4 shrink-0 text-danger"
                  strokeWidth={1.8}
                />
                <p className="text-danger text-xs leading-5">{message}</p>
              </div>
            ) : null}

            {/* Business service */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Building2
                  className="mt-0.5 size-4 shrink-0 text-brand"
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
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Boxes
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Dependencies</h3>
                </div>
                <div className="border-border rounded-xl border">
                  {dependencies.length > 0 ? (
                    <ul className="divide-y divide-border px-3 py-2">
                      {dependencies.map((item) => (
                        <li key={item.id}>
                          <label className="flex items-start gap-2.5 py-2.5 text-xs cursor-pointer hover:bg-neutral-soft/40 -mx-3 px-3 transition-colors">
                            <input
                              type="checkbox"
                              value={item.id}
                              {...register("dependencyIds")}
                              className="mt-0.5 shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="font-medium block">
                                {item.assetCode}
                              </span>
                              <span className="text-muted block truncate">
                                {item.name}
                                {item.status !== "active"
                                  ? ` (${item.status} — existing link)`
                                  : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-5 text-center">
                      <Boxes
                        className="text-muted mx-auto mb-2 size-6"
                        strokeWidth={1.5}
                      />
                      <p className="text-xs font-medium">No assets available</p>
                      <p className="text-muted mt-0.5 text-xs">
                        No other assets found to link as dependencies.
                      </p>
                    </div>
                  )}
                </div>
                {cycleMessage ? (
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-danger"
                      strokeWidth={1.8}
                    />
                    <p className="text-danger break-words text-xs leading-5">
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
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Radio
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Event sources</h3>
                </div>
                <div className="border-border rounded-xl border">
                  {sources.length > 0 ? (
                    <ul className="divide-y divide-border px-3 py-2">
                      {sources.map((item) => (
                        <li key={item.id}>
                          <label className="flex items-start gap-2.5 py-2.5 text-xs cursor-pointer hover:bg-neutral-soft/40 -mx-3 px-3 transition-colors">
                            <input
                              type="checkbox"
                              value={item.id}
                              {...register("eventSourceIds")}
                              className="mt-0.5 shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="font-medium block">
                                {item.name}
                              </span>
                              <span className="text-muted block truncate">
                                {item.sourceType}
                                {item.status !== "active"
                                  ? ` (${item.status} — existing link)`
                                  : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-5 text-center">
                      <Radio
                        className="text-muted mx-auto mb-2 size-6"
                        strokeWidth={1.5}
                      />
                      <p className="text-xs font-medium">
                        No event sources available
                      </p>
                      <p className="text-muted mt-0.5 text-xs">
                        Register event sources first to link them here.
                      </p>
                    </div>
                  )}
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
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Select the operational context used by risk, incident, and
                anomaly workflows. Changes take effect immediately after saving.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
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
