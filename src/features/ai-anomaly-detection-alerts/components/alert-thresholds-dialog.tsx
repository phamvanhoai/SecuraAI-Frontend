"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useAlertThresholdAssetOptions, useAlertThresholds, useSetAlertThreshold } from "../hooks/use-alert-thresholds";
import { alertThresholdFormSchema, thresholdRiskLevels, type AlertThreshold, type AlertThresholdFormInput, type AlertThresholdFormValues } from "../schemas/alert-threshold-schema";

const defaults: AlertThresholdFormInput = { assetId: "", thresholdPercent: 80, riskLevelMin: "", enabled: true };

export function AssetThresholdOverridesManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AlertThreshold | null | undefined>();
  const thresholds = useAlertThresholds(page, query, true);
  const columns: readonly DataTableColumn<AlertThreshold>[] = [
    {
      key: "asset",
      header: "Asset",
      cell: (item) => <span><strong className="block">{item.asset.assetCode}</strong><span className="text-muted text-xs">{item.asset.name}</span></span>,
    },
    { key: "threshold", header: "Threshold", cell: (item) => <span className="tabular-nums">{Math.round(item.threshold * 100)}%</span> },
    { key: "risk", header: "Minimum risk", cell: (item) => item.riskLevelMin ? formatLevel(item.riskLevelMin) : "Any" },
    { key: "status", header: "Status", cell: (item) => <StatusBadge tone={item.enabled ? "success" : "neutral"}>{item.enabled ? "Enabled" : "Disabled"}</StatusBadge> },
    { key: "action", header: "Actions", cell: (item) => <Button className="min-h-10 px-3" onClick={() => setEditing(item)} variant="secondary"><Pencil aria-hidden="true" className="size-4" />Edit</Button> },
  ];
  return <>
    <ProductPanel title="Set Custom Alert Threshold" description={thresholds.data ? `${thresholds.data.pagination.total} asset-specific threshold overrides found` : "Override the default model threshold for individual assets"}>
      <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
        <form className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(draft.trim()); }}>
          <label className="relative min-w-0 flex-1 sm:max-w-md"><span className="sr-only">Search asset threshold overrides</span><Search aria-hidden="true" className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input className="pl-9" maxLength={100} onChange={(event) => setDraft(event.target.value)} placeholder="Search by asset code or name" value={draft} /></label>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Button onClick={() => setEditing(null)}><Plus aria-hidden="true" className="size-4" />Add override</Button>
      </div>
      <div className="p-4">
        {thresholds.isPending ? <TableSkeleton headers={["Asset", "Threshold", "Minimum risk", "Status", "Actions"]} rows={6} /> : thresholds.isError ? <Alert>Unable to load configured asset overrides.</Alert> : thresholds.data?.items.length ? <DataTable columns={columns} getRowKey={(item) => item.id} rows={thresholds.data.items} /> : <div className="py-10 text-center"><p className="font-medium">No asset overrides found</p><p className="text-muted mt-1 text-sm">Add an override or broaden the search.</p></div>}
      </div>
      {thresholds.data ? <div className="border-border border-t p-4"><Pagination onPageChange={setPage} page={thresholds.data.pagination.page} pageCount={thresholds.data.pagination.totalPages} /></div> : null}
    </ProductPanel>
    <ThresholdFormDialog editing={editing} open={editing !== undefined} onClose={() => setEditing(undefined)} />
  </>;
}

function ThresholdFormDialog({ editing, open, onClose }: { editing: AlertThreshold | null | undefined; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const assets = useAlertThresholdAssetOptions(query, open && !editing);
  const mutation = useSetAlertThreshold();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlertThresholdFormInput, unknown, AlertThresholdFormValues>({ resolver: zodResolver(alertThresholdFormSchema), defaultValues: defaults });
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  useEffect(() => { reset(editing ? { assetId: editing.asset.id, thresholdPercent: editing.threshold * 100, riskLevelMin: editing.riskLevelMin ?? "", enabled: editing.enabled } : defaults); }, [editing, reset]);
  const close = () => { setMessage(undefined); setDraft(""); setQuery(""); onClose(); };
  const submit = async (values: AlertThresholdFormValues) => { setMessage(undefined); try { await mutation.mutateAsync({ assetId: values.assetId, input: { threshold: values.thresholdPercent / 100, riskLevelMin: values.riskLevelMin || null, enabled: values.enabled } }); toast.success("Asset threshold override saved", "This asset will use its override instead of the default model threshold."); close(); } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Unable to save the asset override."); } };
  return <Dialog dialogRef={dialogRef} onClose={close} title={editing ? "Edit asset threshold override" : "Add asset threshold override"}>
    <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
      {!editing ? <div className="flex gap-2"><Input maxLength={100} onChange={(event) => setDraft(event.target.value)} placeholder="Search active assets" value={draft} /><Button onClick={() => setQuery(draft.trim())} type="button" variant="secondary">Search</Button></div> : null}
      <FormField error={errors.assetId?.message} id="threshold-asset" label="Asset">{editing ? <Input disabled id="threshold-asset" value={`${editing.asset.assetCode} — ${editing.asset.name}`} /> : <Select id="threshold-asset" {...register("assetId")}><option value="">Select an active asset</option>{assets.data?.map((asset) => <option key={asset.id} value={asset.id}>{asset.assetCode} — {asset.name}</option>)}</Select>}</FormField>
      {assets.isError ? <Alert>Unable to load active assets.</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2"><FormField error={errors.thresholdPercent?.message} id="threshold-percent" label="Anomaly score threshold (%)"><Input id="threshold-percent" min={1} max={100} type="number" {...register("thresholdPercent")} /></FormField><FormField id="threshold-risk" label="Minimum risk level"><Select id="threshold-risk" {...register("riskLevelMin")}><option value="">Any risk level</option>{thresholdRiskLevels.map((level) => <option key={level} value={level}>{formatLevel(level)}</option>)}</Select></FormField></div>
      <label className="flex min-h-10 items-center gap-3 text-sm font-medium"><Checkbox {...register("enabled")} />Enable this override</label>
      {message ? <Alert className="text-danger">{message}</Alert> : null}
      <div className="border-border flex justify-end gap-2 border-t pt-4"><Button onClick={close} type="button" variant="secondary">Cancel</Button><Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Save override"}</Button></div>
    </form>
  </Dialog>;
}

function formatLevel(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
