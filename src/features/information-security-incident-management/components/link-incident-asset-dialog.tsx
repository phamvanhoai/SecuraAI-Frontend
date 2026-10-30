"use client";

import { Boxes, CheckCircle2, Link2, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useIncidentLinkSelection } from "../hooks/use-incident-link-selection";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import {
  useIncidentAssetOptions,
  useLinkIncidentToAsset,
  useUnlinkIncidentFromAsset,
} from "../hooks/use-incidents";
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
  const selection = useIncidentLinkSelection();
  const availableAssets = availableOptions.data?.assets ?? [];
  const linkedAssets = linkedOptions.data?.assets ?? [];
  const hasLinkedAssets =
    linkedAssets.length > 0 || Boolean(incident?.relatedCounts.assets);

  useEffect(() => {
    if (incident) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [incident]);

  const close = () => {
    if (selection.busy) return;
    selection.reset();
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
  };

  const searchLinkedAssets = () => {
    setLinkedSearch(linkedDraft.trim());
    setLinkedPage(1);
  };

  const submit = async () => {
    if (
      !incident ||
      selection.busy ||
      unlinkMutation.isPending ||
      !selection.count
    )
      return;
    const result = await selection.submit((assetId) =>
      mutation.mutateAsync({ id: incident.id, values: { assetId } }),
    );
    if (!result) return;
    if (result.succeeded)
      toast.success(
        "Links saved",
        `${result.succeeded} asset(s) linked to ${incident.incidentCode}.`,
      );
    setLinkedSearch("");
    setLinkedDraft("");
    setLinkedPage(1);
  };

  const unlink = async (assetId: string) => {
    if (!incident || selection.busy) return;
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
      onCancel={(event) => {
        if (selection.busy) event.preventDefault();
      }}
    >
      {incident ? (
        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {selection.failures.length ? (
            <Alert>
              Could not link: {selection.failures.join(", ")}. Successful links
              were saved. Failed items remain selected; refresh options or
              retry.
            </Alert>
          ) : null}
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted font-mono font-semibold">
                {incident.incidentCode}
              </span>
              <span className="text-foreground font-semibold break-words">
                {incident.title}
              </span>
            </div>
          </div>

          {/* Alerts */}
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

          {/* Linked assets section */}
          {hasLinkedAssets ? (
            <section
              aria-labelledby="linked-assets-heading"
              className="border-border bg-neutral-soft/30 rounded-xl border"
            >
              <div className="border-border border-b p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-brand size-4"
                  />
                  <div>
                    <h3
                      id="linked-assets-heading"
                      className="text-foreground text-sm font-semibold"
                    >
                      Linked assets
                    </h3>
                    <p className="text-muted text-xs">
                      These assets already provide context for this incident.
                    </p>
                  </div>
                </div>
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
                <ul className="space-y-2.5 p-4">
                  {linkedAssets.map((asset) => (
                    <li
                      key={asset.id}
                      className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium break-words">{asset.name}</p>
                        <p className="text-muted mt-0.5 text-xs">
                          {asset.assetCode} · {asset.assetType}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="bg-neutral-soft text-muted rounded-md px-2 py-0.5 text-xs font-medium capitalize">
                          {asset.criticality ?? "—"}
                        </span>
                        {unlinkTargetId !== asset.id ? (
                          <button
                            className="text-danger hover:bg-danger-soft focus-visible:outline-danger min-h-8 rounded-md px-2 text-xs font-semibold focus-visible:outline-2"
                            disabled={
                              selection.busy || unlinkMutation.isPending
                            }
                            onClick={() => setUnlinkTargetId(asset.id)}
                            type="button"
                          >
                            Unlink
                          </button>
                        ) : null}
                      </div>
                      {unlinkTargetId === asset.id ? (
                        <div className="border-danger/20 bg-danger-soft mt-3 rounded-xl border p-3 sm:col-span-2">
                          <p className="text-sm font-semibold">
                            Remove this asset link?
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            The asset and incident records will not be deleted.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              className="min-h-9 px-3 text-xs"
                              disabled={
                                selection.busy || unlinkMutation.isPending
                              }
                              onClick={() => setUnlinkTargetId(undefined)}
                              type="button"
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="min-h-9 px-3 text-xs"
                              disabled={
                                selection.busy || unlinkMutation.isPending
                              }
                              onClick={() => void unlink(asset.id)}
                              type="button"
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

          {/* Available assets — radio card list */}
          <section
            aria-labelledby="available-assets-heading"
            className="space-y-4"
          >
            <div className="border-border flex items-center gap-2 border-b pb-2">
              <Boxes
                aria-hidden="true"
                className="text-brand size-4"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="available-assets-heading"
                  className="text-foreground text-sm font-semibold"
                >
                  {hasLinkedAssets
                    ? "Link another asset"
                    : "Select an asset to link"}
                </h3>
                <p className="text-muted text-xs">
                  The link provides asset context for investigation and later
                  risk reassessment.
                </p>
              </div>
            </div>

            {/* Search row */}
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

            {/* Radio card list */}
            {availableOptions.isPending ? (
              <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                <p className="text-muted text-sm">Loading assets…</p>
              </div>
            ) : availableAssets.length === 0 ? (
              <div className="border-border bg-neutral-soft/20 rounded-xl border p-8 text-center">
                <Boxes
                  aria-hidden="true"
                  className="text-muted mx-auto size-8 stroke-1"
                />
                <p className="text-muted mt-2 text-sm">
                  {availableSearch
                    ? "No assets match this search."
                    : "All active assets are already linked to this incident."}
                </p>
              </div>
            ) : (
              <ul
                className="space-y-2"
                role="group"
                aria-labelledby="available-assets-heading"
              >
                {availableAssets.map((asset) => {
                  const isSelected = Boolean(selection.selected[asset.id]);
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={() =>
                          selection.toggle(asset.id, asset.assetCode)
                        }
                        disabled={selection.busy || unlinkMutation.isPending}
                        className={cn(
                          "border-border focus-visible:outline-brand w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                          isSelected
                            ? "border-brand bg-brand/5 shadow-xs"
                            : "bg-surface hover:bg-neutral-soft/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium break-words">
                              {asset.name}
                            </p>
                            <p className="text-muted mt-0.5 text-xs">
                              {asset.assetCode} · {asset.assetType}
                              {asset.criticality
                                ? ` · ${asset.criticality}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded border-2 transition-colors",
                              isSelected
                                ? "border-brand bg-brand"
                                : "border-border bg-surface",
                            )}
                          >
                            {isSelected ? (
                              <CheckCircle2
                                aria-hidden="true"
                                className="size-3 text-white"
                              />
                            ) : null}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Validation error */}

            {/* Pagination */}
            {availableOptions.data &&
            availableOptions.data.pagination.totalPages > 1 ? (
              <Pagination
                onPageChange={(page) => {
                  setAvailablePage(page);
                }}
                page={availableOptions.data.pagination.page}
                pageCount={availableOptions.data.pagination.totalPages}
              />
            ) : null}
          </section>

          {/* Footer actions */}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <p className="text-muted text-xs" role="status">
              {selection.count} selected across pages
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={close}
                disabled={selection.busy}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  selection.busy || unlinkMutation.isPending || !selection.count
                }
              >
                {selection.busy ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Linking…
                  </>
                ) : (
                  <>
                    <Link2
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    {`Link selected (${selection.count})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
