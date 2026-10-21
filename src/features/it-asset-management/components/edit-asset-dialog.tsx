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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useUpdateAsset } from "../hooks/use-update-asset";
import { assetTypes, assetTypeLabels } from "../schemas/asset-type-schema";
import { updateAssetSchema, type UpdateAssetInput, type UpdateAssetRequest } from "../schemas/update-asset-schema";

export function EditAssetDialog({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const detail = useAssetDetail(assetId);
  const mutation = useUpdateAsset(assetId);
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateAssetInput, unknown, UpdateAssetRequest>({ resolver: zodResolver(updateAssetSchema) });
  useEffect(() => { const element = dialog.current; if (!element) return; if (assetId && !element.open) element.showModal(); if (!assetId && element.open) element.close(); }, [assetId]);
  useEffect(() => { if (!detail.data) return; reset({ name: detail.data.name, assetType: detail.data.assetType, description: detail.data.description ?? "" }); }, [detail.data, reset]);
  const submit = handleSubmit(async (values) => { try { const asset = await mutation.mutateAsync(values); onClose(); toast.success("Asset updated", `${asset.assetCode} – ${asset.name}`); } catch (error: unknown) { toast.error("Unable to update asset", error instanceof Error ? error.message : "Please try again."); } });

  return <Dialog dialogRef={dialog} title="Edit IT Asset" onClose={onClose} className="w-[min(36rem,calc(100%-2rem))]">
    {detail.isPending ? <div className="space-y-4 py-2" role="status"><span className="sr-only">Loading asset information</span><Skeleton className="h-5 w-40" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div><Skeleton className="h-28 w-full" /></div> : null}
    {detail.isError ? <Alert>Unable to load the selected asset.</Alert> : null}
    {detail.data ? <form className="space-y-5" noValidate onSubmit={submit}>
      <p className="text-muted text-sm">Asset code: <strong className="text-foreground">{detail.data.assetCode}</strong></p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="edit-name" label="Asset name" error={errors.name?.message}><Input id="edit-name" maxLength={255} {...register("name")} /></FormField>
        <FormField id="edit-type" label="Asset type" error={errors.assetType?.message}>
          <Select id="edit-type" aria-required="true" aria-invalid={Boolean(errors.assetType)} aria-describedby={errors.assetType ? "edit-type-error" : undefined} {...register("assetType")}>
            <option value="" disabled>Select asset type</option>
            {!assetTypes.some((value) => value === detail.data.assetType) ? <option value={detail.data.assetType} disabled>{detail.data.assetType} (legacy — select a supported type)</option> : null}
            {assetTypes.map((value) => <option key={value} value={value}>{assetTypeLabels[value]}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField id="edit-description" label="Description" error={errors.description?.message}><Textarea id="edit-description" maxLength={10_000} rows={4} {...register("description")} /></FormField>
      <p className="text-muted text-xs leading-5">Use Assign owner, Classify asset, and Manage links for ownership, classification, and relationship changes.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save changes"}</Button></div>
    </form> : null}
  </Dialog>;
}
