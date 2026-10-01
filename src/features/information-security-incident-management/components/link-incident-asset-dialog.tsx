"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import {
  useIncidentAssetOptions,
  useLinkIncidentToAsset,
  useUnlinkIncidentFromAsset,
} from "../hooks/use-incidents";
import {
  linkIncidentAssetFormSchema,
  type LinkIncidentAssetForm,
} from "../schemas/incident-asset-schema";
import type { Incident } from "../schemas/report-incident-schema";

export function LinkIncidentAssetDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [availableDraft, setAvailableDraft] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [linkedDraft, setLinkedDraft] = useState("");
  const [linkedSearch, setLinkedSearch] = useState("");
  const [linkedPage, setLinkedPage] = useState(1);
  const availableOptions = useIncidentAssetOptions(incident?.id, {
    q: availableSearch,
    scope: "unlinked",
    page: availablePage,
    limit: 10,
  });
  const linkedOptions = useIncidentAssetOptions(incident?.id, {
    q: linkedSearch,
    scope: "linked",
    page: linkedPage,
    limit: 5,
  });
  const mutation = useLinkIncidentToAsset();
  const unlinkMutation = useUnlinkIncidentFromAsset();
  const toast = useToast();
  const [unlinkTargetId, setUnlinkTargetId] = useState<string>();
  const form = useForm<LinkIncidentAssetForm>({
    resolver: zodResolver(linkIncidentAssetFormSchema),
    defaultValues: { assetId: "" },
  });
  const availableAssets = availableOptions.data?.assets ?? [];
  const linkedAssets = linkedOptions.data?.assets ?? [];
  const hasLinkedAssets = incident ? incident.relatedCounts.assets > 0 : false;

  useEffect(() => {
    if (incident) {
      form.reset({ assetId: "" });
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [form, incident]);

  const close = () => {
    setUnlinkTargetId(undefined);
    setAvailableDraft("");
    setAvailableSearch("");
    setAvailablePage(1);
    setLinkedDraft("");
    setLinkedSearch("");
    setLinkedPage(1);
    onClose();
  };

  const searchAvailableAssets = () => {
    setAvailableSearch(availableDraft.trim());
    setAvailablePage(1);
    form.reset({ assetId: "" });
  };

  const searchLinkedAssets = () => {
    setLinkedSearch(linkedDraft.trim());
    setLinkedPage(1);
  };

  const submit = async (values: LinkIncidentAssetForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Asset linked",
        `${linked.asset.assetCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      close();
    } catch {
      // The normalized API error is rendered persistently below.
    }
  };

  const unlink = async (assetId: string) => {
    if (!incident) return;
    const asset = linkedAssets.find((item) => item.id === assetId);
    try {
      await unlinkMutation.mutateAsync({ incidentId: incident.id, assetId });
      toast.success(
        "Asset unlinked",
        `${asset?.assetCode ?? "The asset"} is no longer linked to ${incident.incidentCode}.`,
      );
      setUnlinkTargetId(undefined);
    } catch {
      // The normalized API error is rendered persistently below.
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title={hasLinkedAssets ? "Link another asset" : "Link incident to asset"}
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
    >
      {incident ? (
        <form
          className="space-y-5"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          <div className="border-border bg-neutral-soft rounded-lg border p-4">
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              {incident.incidentCode}
            </p>
            <p className="mt-1 font-semibold break-words">{incident.title}</p>
          </div>
          {availableOptions.isError || linkedOptions.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load active assets. Check your session and backend
              connection.
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to link this asset."}
            </Alert>
          ) : null}
          {unlinkMutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {unlinkMutation.error instanceof Error
                ? unlinkMutation.error.message
                : "Unable to unlink this asset."}
            </Alert>
          ) : null}
          {hasLinkedAssets ? (
            <section
              aria-labelledby="linked-assets-heading"
              className="border-border rounded-lg border"
            >
              <div className="border-border border-b px-4 py-3">
                <h3
                  id="linked-assets-heading"
                  className="text-sm font-semibold"
                >
                  Already linked assets
                </h3>
                <p className="text-muted mt-0.5 text-xs">
                  These assets already provide context for this incident.
                </p>
                <div className="mt-3 flex gap-2">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Search linked assets</span>
                    <Search
                      aria-hidden="true"
                      className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                      strokeWidth={1.8}
                    />
                    <Input
                      className="min-h-10 pl-9"
                      maxLength={100}
                      onChange={(event) => setLinkedDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          searchLinkedAssets();
                        }
                      }}
                      placeholder="Search linked assets"
                      value={linkedDraft}
                    />
                  </label>
                  <Button
                    aria-label="Search linked assets"
                    className="min-h-10 px-3"
                    onClick={searchLinkedAssets}
                    type="button"
                    variant="secondary"
                  >
                    Search
                  </Button>
                </div>
              </div>
              {linkedOptions.isPending ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  Loading linked assets…
                </p>
              ) : linkedAssets.length === 0 ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  No linked assets match this search.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {linkedAssets.map((asset) => (
                    <li className="px-4 py-3 text-sm" key={asset.id}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {asset.name}
                          </span>
                          <span className="text-muted block text-xs">
                            {asset.assetCode} · {asset.assetType}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="bg-neutral-soft text-muted rounded-md px-2 py-1 text-xs font-medium capitalize">
                            {asset.criticality}
                          </span>
                          {unlinkTargetId !== asset.id ? (
                            <button
                              className="text-danger hover:bg-danger-soft focus-visible:outline-danger min-h-8 rounded-md px-2 text-xs font-semibold focus-visible:outline-2"
                              disabled={unlinkMutation.isPending}
                              onClick={() => setUnlinkTargetId(asset.id)}
                              type="button"
                            >
                              Unlink
                            </button>
                          ) : null}
                        </span>
                      </div>
                      {unlinkTargetId === asset.id ? (
                        <div className="border-danger/20 bg-danger-soft mt-3 rounded-md border p-3">
                          <p className="text-sm font-medium">
                            Remove this asset link?
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            The asset and incident records will not be deleted.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              className="min-h-9 px-3 py-1.5 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => setUnlinkTargetId(undefined)}
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="min-h-9 px-3 py-1.5 text-xs"
                              disabled={unlinkMutation.isPending}
                              onClick={() => void unlink(asset.id)}
                              variant="danger"
                            >
                              {unlinkMutation.isPending
                                ? "Unlinking…"
                                : "Remove link"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {linkedOptions.data &&
              linkedOptions.data.pagination.totalPages > 1 ? (
                <div className="border-border border-t px-4 py-3">
                  <Pagination
                    onPageChange={setLinkedPage}
                    page={linkedOptions.data.pagination.page}
                    pageCount={linkedOptions.data.pagination.totalPages}
                  />
                </div>
              ) : null}
            </section>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="asset-search">
              Search available assets
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.8}
                />
                <Input
                  className="pl-9"
                  id="asset-search"
                  maxLength={100}
                  onChange={(event) => setAvailableDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchAvailableAssets();
                    }
                  }}
                  placeholder="Search by asset code or name"
                  value={availableDraft}
                />
              </div>
              <Button
                aria-label="Search available assets"
                onClick={searchAvailableAssets}
                type="button"
                variant="secondary"
              >
                Search
              </Button>
            </div>
          </div>
          <FormField
            id="incident-asset"
            label={hasLinkedAssets ? "Additional asset" : "Asset"}
            error={form.formState.errors.assetId?.message}
          >
            <Select
              id="incident-asset"
              autoFocus
              disabled={
                availableOptions.isPending ||
                availableOptions.isError ||
                availableAssets.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.assetId)}
              {...form.register("assetId")}
            >
              <option value="">
                {availableOptions.isPending
                  ? "Loading active assets…"
                  : "Select an active asset"}
              </option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetCode} — {asset.name} ({asset.criticality})
                </option>
              ))}
            </Select>
            {!availableOptions.isPending &&
            !availableOptions.isError &&
            availableAssets.length === 0 ? (
              <p className="text-muted text-xs">
                {availableSearch
                  ? "No available assets match this search."
                  : "All active assets are already linked to this incident."}
              </p>
            ) : (
              <p className="text-muted text-xs">
                The link provides asset context for investigation and later risk
                reassessment.
              </p>
            )}
          </FormField>
          {availableOptions.data &&
          availableOptions.data.pagination.totalPages > 1 ? (
            <Pagination
              onPageChange={(page) => {
                setAvailablePage(page);
                form.reset({ assetId: "" });
              }}
              page={availableOptions.data.pagination.page}
              pageCount={availableOptions.data.pagination.totalPages}
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || availableAssets.length === 0}
            >
              {mutation.isPending
                ? "Linking…"
                : hasLinkedAssets
                  ? "Link another asset"
                  : "Link asset"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
