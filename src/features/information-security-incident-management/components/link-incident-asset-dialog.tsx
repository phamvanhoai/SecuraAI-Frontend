"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import {
  useIncidentAssetOptions,
  useLinkIncidentToAsset,
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
  const options = useIncidentAssetOptions(incident?.id);
  const mutation = useLinkIncidentToAsset();
  const toast = useToast();
  const form = useForm<LinkIncidentAssetForm>({
    resolver: zodResolver(linkIncidentAssetFormSchema),
    defaultValues: { assetId: "" },
  });
  const availableAssets = useMemo(
    () => options.data?.assets.filter((asset) => !asset.linked) ?? [],
    [options.data],
  );

  useEffect(() => {
    if (incident) {
      form.reset({ assetId: "" });
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [form, incident]);

  const submit = async (values: LinkIncidentAssetForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Asset linked",
        `${linked.asset.assetCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      onClose();
    } catch {
      // The normalized API error is rendered persistently below.
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title="Link incident to asset"
      className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto"
      onClose={onClose}
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
          {options.isError ? (
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
          <FormField
            id="incident-asset"
            label="Asset"
            error={form.formState.errors.assetId?.message}
          >
            <Select
              id="incident-asset"
              autoFocus
              disabled={
                options.isPending ||
                options.isError ||
                availableAssets.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.assetId)}
              {...form.register("assetId")}
            >
              <option value="">
                {options.isPending
                  ? "Loading active assets…"
                  : "Select an active asset"}
              </option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetCode} — {asset.name} ({asset.criticality})
                </option>
              ))}
            </Select>
            {!options.isPending &&
            !options.isError &&
            availableAssets.length === 0 ? (
              <p className="text-muted text-xs">
                All active assets are already linked to this incident.
              </p>
            ) : (
              <p className="text-muted text-xs">
                The link provides asset context for investigation and later risk
                reassessment.
              </p>
            )}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || availableAssets.length === 0}
            >
              {mutation.isPending ? "Linking…" : "Link asset"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
