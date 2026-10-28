"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  FileText,
  Info,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRiskAssessment } from "../hooks/use-create-risk-assessment";
import {
  createRiskAssessmentSchema,
  type CreateRiskAssessmentForm,
  type CreateRiskAssessmentInput,
  type CreateRiskAssessmentRequest,
} from "../schemas/create-risk-assessment-schema";
import { RiskOptionPicker } from "./risk-option-picker";
import {
  nextRiskReviewDate,
  reviewDatePreview,
} from "../schemas/risk-review-date";

const scopeTypes = [
  {
    value: "asset" as const,
    label: "Asset",
    description: "Risk is scoped to a specific IT or information asset.",
  },
  {
    value: "business_service" as const,
    label: "Business service",
    description: "Risk is scoped to a business process or service.",
  },
];

const defaults = (): CreateRiskAssessmentInput => ({
  scopeType: "asset",
  scopeId: "",
  title: "",
  description: "",
  ownerUserId: "",
  reviewDate: nextRiskReviewDate(),
});

export function CreateRiskAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateRiskAssessment();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>({
    resolver: zodResolver(createRiskAssessmentSchema),
    defaultValues: defaults(),
  });

  const scopeType = useWatch({ control, name: "scopeType" });
  const reviewDate = useWatch({ control, name: "reviewDate" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    setMessage(undefined);
  };

  const submit = async (values: CreateRiskAssessmentForm) => {
    const request: CreateRiskAssessmentRequest = {
      title: values.title,
      description: values.description,
      ownerUserId: values.ownerUserId,
      reviewDate: values.reviewDate,
      scope:
        values.scopeType === "asset"
          ? { type: "asset", assetId: values.scopeId }
          : {
              type: "business_service",
              businessServiceId: values.scopeId,
            },
    };
    try {
      const created = await mutation.mutateAsync(request);
      reset(defaults());
      close();
      toast.success(
        "Risk created",
        `${created.riskCode} is ready for threat and vulnerability identification.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create risk.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          reset(defaults());
          setOpen(true);
        }}
      >
        <Plus className="size-4" aria-hidden="true" strokeWidth={1.8} />
        Create Risk
      </Button>

      <Dialog
        title="Create Risk"
        dialogRef={dialogRef}
        onClose={close}
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      >
        <form
          className="space-y-6"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <AlertTriangle
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted"
                strokeWidth={1.8}
              />
              <span className="text-foreground font-semibold">
                New risk record
              </span>
            </div>
            <p className="text-muted mt-1.5">
              After creation, identify threats and vulnerabilities before
              assessing inherent risk. Control effectiveness, residual risk, and
              target risk are completed in their dedicated steps.
            </p>
          </div>

          {/* Submit error */}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}

          {/* Section 1 — Scope & ownership */}
          <section aria-labelledby="create-risk-scope-heading" className="space-y-4">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Building2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="create-risk-scope-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Scope and ownership
                </h3>
                <p className="text-xs text-muted">
                  Define what this risk applies to and who is responsible.
                </p>
              </div>
            </div>

            {/* Scope type — radio cards */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                Risk scope
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {scopeTypes.map((s) => (
                  <label
                    key={s.value}
                    className={cn(
                      "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                      scopeType === s.value
                        ? "border-brand bg-brand/5"
                        : "bg-surface hover:bg-neutral-soft",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      value={s.value}
                      {...register("scopeType", {
                        onChange: () => setValue("scopeId", ""),
                      })}
                    />
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-muted text-xs leading-snug">
                      {s.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Scope target */}
            <div className="space-y-1.5">
              <label
                htmlFor="scopeId"
                className="text-sm font-medium text-foreground"
              >
                {scopeType === "asset" ? "Asset" : "Business service"}
                <span className="text-danger ml-0.5">*</span>
              </label>
              <Controller
                name="scopeId"
                control={control}
                render={({ field }) => (
                  <RiskOptionPicker
                    key={scopeType}
                    id="scopeId"
                    kind={scopeType}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    enabled={open}
                    invalid={Boolean(errors.scopeId)}
                  />
                )}
              />
              {errors.scopeId ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.scopeId.message}
                </p>
              ) : null}
            </div>

            {/* Owner */}
            <div className="space-y-1.5">
              <label
                htmlFor="ownerUserId"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <User
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Risk owner
                  <span className="text-danger ml-0.5">*</span>
                </span>
              </label>
              <Controller
                name="ownerUserId"
                control={control}
                render={({ field }) => (
                  <RiskOptionPicker
                    id="ownerUserId"
                    kind="owner"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    enabled={open}
                    invalid={Boolean(errors.ownerUserId)}
                  />
                )}
              />
              {errors.ownerUserId ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.ownerUserId.message}
                </p>
              ) : null}
            </div>

            {/* Review date */}
            <div className="space-y-1.5">
              <label
                htmlFor="reviewDate"
                className="text-sm font-medium text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-3.5 text-muted"
                    strokeWidth={1.8}
                  />
                  Review date
                  <span className="text-danger ml-0.5">*</span>
                </span>
              </label>
              <Input
                id="reviewDate"
                type="date"
                min={nextRiskReviewDate()}
                aria-invalid={Boolean(errors.reviewDate)}
                aria-describedby={`reviewDate-help${errors.reviewDate ? " reviewDate-error" : ""}`}
                {...register("reviewDate")}
              />
              <p id="reviewDate-help" className="text-muted text-xs">
                Choose a date after today. Selected:{" "}
                <span className="font-medium text-foreground">
                  {reviewDatePreview(reviewDate)}
                </span>
                .
              </p>
              {errors.reviewDate ? (
                <p
                  id="reviewDate-error"
                  className="text-danger text-xs"
                  role="alert"
                >
                  {errors.reviewDate.message}
                </p>
              ) : null}
            </div>
          </section>

          {/* Section 2 — Risk context */}
          <section aria-labelledby="create-risk-context-heading" className="space-y-4">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileText
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <div>
                <h3
                  id="create-risk-context-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Risk context
                </h3>
                <p className="text-xs text-muted">
                  Describe the risk in enough detail to support assessment.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="riskTitle"
                className="text-sm font-medium text-foreground"
              >
                Risk title
                <span className="text-danger ml-0.5">*</span>
              </label>
              <Input
                id="riskTitle"
                maxLength={255}
                autoFocus
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="riskDescription"
                className="text-sm font-medium text-foreground"
              >
                Context and scope
                <span className="text-muted ml-1.5 text-xs font-normal">
                  (optional)
                </span>
              </label>
              <Textarea
                id="riskDescription"
                rows={4}
                maxLength={5000}
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-danger text-xs" role="alert">
                  {errors.description.message}
                </p>
              ) : null}
            </div>
          </section>

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <p className="text-xs text-muted">
              After creation, use the risk detail panel to identify threats and
              vulnerabilities, then assess inherent risk. Residual risk and
              target risk levels are set in their dedicated assessment steps.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div />
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Creating…
                  </>
                ) : (
                  <>
                    <AlertTriangle
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    Create Risk
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
