"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
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
        const cycle = z.object({ error: z.object({
          code: z.literal("ASSET_DEPENDENCY_CYCLE"),
          details: z.object({ path: z.array(z.string()) }).optional(),
        }) }).safeParse(error.details);
        if (cycle.success) {
          const path = cycle.data.error.details?.path ?? [];
          setCycleMessage(`${error.message}${path.length ? ` Circular dependency: ${path.join(" → ")}.` : ""}`);
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
      name: `${detail.data.businessService.name} (Inactive — existing link)`,
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
  return (
    <Dialog
      title="Link Asset Context"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div
        role="tablist"
        aria-label="Asset context views"
        className="border-border bg-surface mb-4 flex gap-1 rounded-xl border p-1"
      >
        {(["links", "history"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`asset-context-${value}-tab`}
            aria-controls={`asset-context-${value}-panel`}
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            className={cn(
              "min-h-11 min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2",
              tab === value
                ? "bg-brand text-brand-contrast"
                : "text-muted hover:bg-neutral-soft",
            )}
            onClick={() => setTab(value)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "links"
                  : event.key === "End"
                    ? "history"
                    : value === "links"
                      ? "history"
                      : "links";
              setTab(next);
              ref.current
                ?.querySelector<HTMLButtonElement>(`#asset-context-${next}-tab`)
                ?.focus();
            }}
          >
            {value === "links" ? (
              "Link Asset Context"
            ) : (
              <>
                <History aria-hidden="true" className="mr-1 inline size-4" />
                History
                {history.data ? ` (${history.data.pagination.total})` : ""}
              </>
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="asset-context-history-panel"
        aria-labelledby="asset-context-history-tab"
        hidden={tab !== "history"}
      >
        {tab === "history" && assetId ? (
          <AssetContextHistory key={assetId} assetId={assetId} />
        ) : null}
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={close}>Close</Button>
        </div>
      </div>
      <div
        role="tabpanel"
        id="asset-context-links-panel"
        aria-labelledby="asset-context-links-tab"
        hidden={tab !== "links"}
      >
        {busy ? (
          <div className="space-y-4 py-2" role="status">
            <span className="sr-only">Loading asset context</span>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : detail.isError || options.isError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            Unable to load available relationships.
          </Alert>
        ) : detail.data ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            <p className="text-muted text-sm">
              <strong className="text-foreground">
                {detail.data.assetCode} — {detail.data.name}
              </strong>
              <br />
              Select the operational context used by risk, incident, and anomaly
              workflows.
            </p>
            {detail.data.status !== "active" ? (
              <Alert>
                Archived assets cannot be changed. Close this dialog to view the
                preserved links.
              </Alert>
            ) : null}
            {message ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {message}
              </Alert>
            ) : null}
            <FormField
              id="context-service"
              label="Business service"
              error={errors.businessServiceId?.message}
            >
              <Select id="context-service" {...register("businessServiceId")}>
                <option value="">Unassigned</option>
                {services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="context-dependencies"
                label="Dependencies"
                error={errors.dependencyIds?.message}
              >
                <div className="border-border min-h-36 space-y-2 rounded-lg border p-3">
                  {dependencies.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={item.id}
                        {...register("dependencyIds")}
                        className="mt-1"
                      />
                      <span>
                        {item.assetCode} · {item.name}
                        {item.status !== "active"
                          ? ` (${item.status} — existing link)`
                          : ""}
                      </span>
                    </label>
                  ))}
                </div>
                {cycleMessage ? (
                  <Alert className="border-danger/25 bg-danger-soft text-danger break-words">
                    {cycleMessage}
                  </Alert>
                ) : null}
                <p
                  id="context-dependencies-help"
                  className="text-muted mt-1 text-xs"
                >
                  Select assets this asset needs to operate. Unchecking removes
                  the link; existing inactive links may be kept.
                </p>
              </FormField>
              <FormField
                id="context-sources"
                label="Event sources"
                error={errors.eventSourceIds?.message}
              >
                <div className="border-border min-h-36 space-y-2 rounded-lg border p-3">
                  {sources.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={item.id}
                        {...register("eventSourceIds")}
                        className="mt-1"
                      />
                      <span>
                        {item.name} · {item.sourceType}
                        {item.status !== "active"
                          ? ` (${item.status} — existing link)`
                          : ""}
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  id="context-sources-help"
                  className="text-muted mt-1 text-xs"
                >
                  Select sources that produce events for this asset. Unchecking
                  removes the link.
                </p>
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || detail.data.status !== "active"}
              >
                {mutation.isPending ? "Saving…" : "Save links"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </Dialog>
  );
}
