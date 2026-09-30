"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useLinkAssetContext } from "../hooks/use-link-asset-context";
import { linkAssetContextSchema, type LinkAssetContextInput, type LinkAssetContextRequest } from "../schemas/link-asset-context-schema";

const defaults: LinkAssetContextInput = { businessServiceId: "", dependencyIds: [], eventSourceIds: [] };
export function LinkAssetContextDialog({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const detail = useAssetDetail(assetId); const options = useAssetCreateOptions(Boolean(assetId)); const mutation = useLinkAssetContext(assetId); const toast = useToast(); const [message, setMessage] = useState<string>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkAssetContextInput, unknown, LinkAssetContextRequest>({ resolver: zodResolver(linkAssetContextSchema), defaultValues: defaults });
  useEffect(() => { if (assetId && !ref.current?.open) ref.current?.showModal(); if (!assetId && ref.current?.open) ref.current.close(); }, [assetId]);
  useEffect(() => { if (!detail.data) return; reset({ businessServiceId: detail.data.businessService?.id ?? "", dependencyIds: detail.data.dependencies.map((item) => item.asset.id), eventSourceIds: detail.data.eventSources.map((item) => item.id) }); }, [detail.data, reset]);
  const close = () => { reset(defaults); setMessage(undefined); onClose(); };
  const submit = async (values: LinkAssetContextRequest) => { try { await mutation.mutateAsync(values); toast.success("Asset context updated", "Business service, dependencies, and event sources are now linked."); close(); } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Unable to update asset context."); } };
  const busy = detail.isPending || options.isPending;
  return <Dialog title="Link Asset Context" dialogRef={ref} onClose={close} className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto">{busy ? <p className="text-muted py-10 text-center">Loading asset context…</p> : detail.isError || options.isError ? <Alert className="border-danger/25 bg-danger-soft text-danger">Unable to load available relationships.</Alert> : detail.data ? <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}><p className="text-muted text-sm"><strong className="text-foreground">{detail.data.assetCode} — {detail.data.name}</strong><br />Select the operational context used by risk, incident, and anomaly workflows.</p>{message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}<FormField id="context-service" label="Business service" error={errors.businessServiceId?.message}><Select id="context-service" {...register("businessServiceId")}><option value="">Unassigned</option>{options.data?.businessServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormField><div className="grid gap-4 sm:grid-cols-2"><FormField id="context-dependencies" label="Dependencies" error={errors.dependencyIds?.message}><Select id="context-dependencies" multiple className="min-h-36" aria-describedby="context-dependencies-help" {...register("dependencyIds")}>{options.data?.assets.filter((item) => item.id !== assetId).map((item) => <option key={item.id} value={item.id}>{item.assetCode} · {item.name}</option>)}</Select><p id="context-dependencies-help" className="text-muted mt-1 text-xs">Use Ctrl/Cmd to select multiple assets.</p></FormField><FormField id="context-sources" label="Event sources" error={errors.eventSourceIds?.message}><Select id="context-sources" multiple className="min-h-36" aria-describedby="context-sources-help" {...register("eventSourceIds")}>{options.data?.eventSources.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sourceType}</option>)}</Select><p id="context-sources-help" className="text-muted mt-1 text-xs">Choose all sources that produce events for this asset.</p></FormField></div><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save links"}</Button></div></form> : null}</Dialog>;
}
