"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import { useUpdateAsset } from "../hooks/use-update-asset";
import { updateAssetSchema, type UpdateAssetInput, type UpdateAssetRequest } from "../schemas/update-asset-schema";

export function EditAssetDialog({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const detail = useAssetDetail(assetId); const options = useAssetCreateOptions(assetId !== null); const mutation = useUpdateAsset(assetId); const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateAssetInput, unknown, UpdateAssetRequest>({ resolver: zodResolver(updateAssetSchema) });
  useEffect(() => { const element = dialog.current; if (!element) return; if (assetId && !element.open) element.showModal(); if (!assetId && element.open) element.close(); }, [assetId]);
  useEffect(() => { if (!detail.data) return; reset({ name: detail.data.name, assetType: detail.data.assetType, ownerUserId: detail.data.owner?.id ?? "", businessServiceId: detail.data.businessService?.id ?? "", criticality: detail.data.criticality.toLowerCase() as "low" | "medium" | "high" | "critical", dataClassification: detail.data.dataClassification, description: detail.data.description ?? "", dependencyIds: detail.data.dependencies?.map((item) => item.asset.id) ?? [], eventSourceIds: detail.data.eventSources?.map((item) => item.id) ?? [] }); }, [detail.data, reset]);
  const submit = handleSubmit(async (values) => { try { const asset = await mutation.mutateAsync(values); onClose(); toast.success("Asset updated", `${asset.assetCode} – ${asset.name}`); } catch (error: unknown) { toast.error("Unable to update asset", error instanceof Error ? error.message : "Please try again."); } });
  return <Dialog dialogRef={dialog} title="Edit IT Asset" onClose={onClose} className="w-[min(44rem,calc(100%-2rem))]">{detail.isPending ? <p className="text-muted py-8 text-center">Loading asset information…</p> : null}{detail.isError ? <Alert>Unable to load the selected asset.</Alert> : null}{detail.data ? <form className="space-y-5" noValidate onSubmit={submit}><p className="text-muted text-sm">Asset code: <strong>{detail.data.assetCode}</strong></p><div className="grid gap-4 sm:grid-cols-2">
    <FormField id="edit-name" label="Asset name" error={errors.name?.message}><Input id="edit-name" {...register("name")} /></FormField>
    <FormField id="edit-type" label="Asset type" error={errors.assetType?.message}><Input id="edit-type" {...register("assetType")} /></FormField>
    <FormField id="edit-owner" label="Asset owner" error={errors.ownerUserId?.message}><Select id="edit-owner" {...register("ownerUserId")}><option value="">Unassigned</option>{options.data?.owners.map((item) => <option key={item.id} value={item.id}>{item.fullName} · {item.role}</option>)}</Select></FormField>
    <FormField id="edit-service" label="Business service" error={errors.businessServiceId?.message}><Select id="edit-service" {...register("businessServiceId")}><option value="">Unassigned</option>{options.data?.businessServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormField>
    <FormField id="edit-criticality" label="Criticality" error={errors.criticality?.message}><Select id="edit-criticality" {...register("criticality")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select></FormField>
    <FormField id="edit-classification" label="Data classification" error={errors.dataClassification?.message}><Select id="edit-classification" {...register("dataClassification")}><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option></Select></FormField>
    <FormField id="edit-dependencies" label="Dependencies" error={errors.dependencyIds?.message}><Select id="edit-dependencies" multiple className="min-h-28" {...register("dependencyIds")}>{options.data?.assets.filter((item) => item.id !== assetId).map((item) => <option key={item.id} value={item.id}>{item.assetCode} · {item.name}</option>)}</Select></FormField>
    <FormField id="edit-sources" label="Event sources" error={errors.eventSourceIds?.message}><Select id="edit-sources" multiple className="min-h-28" {...register("eventSourceIds")}>{options.data?.eventSources.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sourceType}</option>)}</Select></FormField>
  </div><FormField id="edit-description" label="Description" error={errors.description?.message}><Textarea id="edit-description" rows={4} {...register("description")} /></FormField><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={mutation.isPending || options.isPending}>{mutation.isPending ? "Saving…" : "Save changes"}</Button></div></form> : null}</Dialog>;
}
