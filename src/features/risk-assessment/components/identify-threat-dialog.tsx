"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIdentifyThreat } from "../hooks/use-identify-threat";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  identifyThreatSchema,
  type IdentifyThreatInput,
} from "../schemas/identify-threat-schema";

export function IdentifyThreatDialog({
  riskId,
  riskLabel,
  onClose,
}: {
  riskId: string | null;
  riskLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const risk = useRiskRecord(riskId);
  const mutation = useIdentifyThreat(riskId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdentifyThreatInput>({
    resolver: zodResolver(identifyThreatSchema),
    defaultValues: { name: "", description: "", vulnerabilityIds: [] },
  });
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (riskId && !dialog.open) dialog.showModal();
    if (!riskId && dialog.open) dialog.close();
  }, [riskId]);
  const close = () => {
    reset();
    setMessage(undefined);
    onClose();
  };
  const submit = async (input: IdentifyThreatInput) => {
    try {
      const created = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Threat identified",
        `${created.name} was linked to ${created.vulnerabilities.length} vulnerabilities.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to identify the threat.",
      );
    }
  };
  return (
    <Dialog
      title="Identify Threat"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Document a threat for{" "}
          <strong className="text-foreground">{riskLabel}</strong> and link it
          to known vulnerabilities.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        {risk.isError ? (
          <Alert>Unable to load vulnerabilities for this risk.</Alert>
        ) : null}
        <FormField
          id="threatName"
          label="Threat name"
          error={errors.name?.message}
        >
          <Input
            id="threatName"
            maxLength={255}
            autoFocus
            {...register("name")}
          />
        </FormField>
        <FormField
          id="threatDescription"
          label="Threat scenario"
          error={errors.description?.message}
        >
          <Textarea
            id="threatDescription"
            rows={4}
            maxLength={3000}
            {...register("description")}
          />
        </FormField>
        <fieldset>
          <legend className="text-sm font-medium">
            Related vulnerabilities
          </legend>
          <p className="text-muted mt-1 text-xs">
            Only vulnerabilities already documented for this risk are available.
          </p>
          <div className="border-border mt-3 max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2">
            {risk.isPending ? (
              <p className="text-muted p-2 text-sm">Loading vulnerabilities…</p>
            ) : risk.data?.vulnerabilities.length ? (
              risk.data.vulnerabilities.map((item) => (
                <label
                  key={item.id}
                  className="hover:bg-neutral-soft flex min-h-10 cursor-pointer items-start gap-3 rounded-md p-2 text-sm"
                >
                  <input
                    className="mt-0.5 size-4"
                    type="checkbox"
                    value={item.id}
                    {...register("vulnerabilityIds")}
                  />
                  <span>
                    <strong className="block font-medium">{item.name}</strong>
                    {item.description ? (
                      <span className="text-muted line-clamp-2">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-muted p-2 text-sm">
                No vulnerabilities are documented for this risk. Add a
                vulnerability before identifying a threat.
              </p>
            )}
          </div>
          {errors.vulnerabilityIds?.message ? (
            <p className="text-danger mt-1 text-xs" role="alert">
              {errors.vulnerabilityIds.message}
            </p>
          ) : null}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              risk.isPending ||
              !risk.data?.vulnerabilities.length
            }
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Identify threat"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
