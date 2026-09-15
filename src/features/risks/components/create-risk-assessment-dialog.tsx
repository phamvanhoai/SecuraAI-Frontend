"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createRiskAssessmentSchema,
  type CreateRiskAssessmentForm,
  type CreateRiskAssessmentInput,
  type CreateRiskAssessmentRequest,
} from "../schemas/create-risk-assessment-schema";
import {
  useCreateRiskAssessment,
  useRiskCreateOptions,
} from "../hooks/use-create-risk-assessment";

const defaults: CreateRiskAssessmentInput = {
  targetType: "asset",
  assetId: "",
  businessProcessId: "",
  title: "",
  description: "",
  likelihood: 3,
  impact: 3,
  threatIds: [],
  vulnerabilityIds: [],
};
export function CreateRiskAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [targetSearch, setTargetSearch] = useState("");
  const [threatSearch, setThreatSearch] = useState("");
  const [vulnerabilitySearch, setVulnerabilitySearch] = useState("");
  const [targetPage, setTargetPage] = useState(1);
  const [threatPage, setThreatPage] = useState(1);
  const [vulnerabilityPage, setVulnerabilityPage] = useState(1);
  const [threatNotes, setThreatNotes] = useState<Record<string, string>>({});
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState<
    Record<string, string>
  >({});
  const ref = useRef<HTMLDialogElement>(null);
  const assetOptions = useRiskCreateOptions(
    "assets",
    open,
    targetSearch,
    targetPage,
  );
  const processOptions = useRiskCreateOptions(
    "businessProcesses",
    open,
    targetSearch,
    targetPage,
  );
  const threatOptions = useRiskCreateOptions(
    "threats",
    open,
    threatSearch,
    threatPage,
  );
  const vulnerabilityOptions = useRiskCreateOptions(
    "vulnerabilities",
    open,
    vulnerabilitySearch,
    vulnerabilityPage,
  );
  const mutation = useCreateRiskAssessment();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>({
    resolver: zodResolver(createRiskAssessmentSchema),
    defaultValues: defaults,
  });
  const [
    targetType,
    likelihoodValue,
    impactValue,
    selectedThreats,
    selectedVulnerabilities,
  ] = useWatch({
    control,
    name: [
      "targetType",
      "likelihood",
      "impact",
      "threatIds",
      "vulnerabilityIds",
    ],
  });
  const likelihood = Number(likelihoodValue);
  const impact = Number(impactValue);
  const score = likelihood * impact;
  const level =
    score <= 4
      ? "Low"
      : score <= 9
        ? "Medium"
        : score <= 16
          ? "High"
          : "Critical";
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const close = (): void => {
    setOpen(false);
    setMessage(undefined);
  };
  const submit = async (values: CreateRiskAssessmentForm): Promise<void> => {
    setMessage(undefined);
    const request: CreateRiskAssessmentRequest = {
      title: values.title,
      likelihood: values.likelihood,
      impact: values.impact,
      threats: values.threatIds.map((threatId) => ({
        threatId,
        ...(threatNotes[threatId]?.trim()
          ? { notes: threatNotes[threatId]?.trim() }
          : {}),
      })),
      vulnerabilities: values.vulnerabilityIds.map((vulnerabilityId) => ({
        vulnerabilityId,
        ...(vulnerabilityNotes[vulnerabilityId]?.trim()
          ? { notes: vulnerabilityNotes[vulnerabilityId]?.trim() }
          : {}),
      })),
      ...(values.description ? { description: values.description } : {}),
      ...(values.targetType === "asset" && values.assetId
        ? { assetId: values.assetId }
        : {}),
      ...(values.targetType === "business_process" && values.businessProcessId
        ? { businessProcessId: values.businessProcessId }
        : {}),
    };
    try {
      const created = await mutation.mutateAsync(request);
      reset(defaults);
      close();
      toast.success(
        "Risk assessment created",
        `${created.riskCode} saved as draft.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create risk assessment.",
      );
    }
  };
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Create assessment
      </Button>
      <Dialog
        title="Create Risk Assessment"
        dialogRef={ref}
        onClose={close}
        className="max-h-[90vh] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
      >
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {[
            assetOptions,
            processOptions,
            threatOptions,
            vulnerabilityOptions,
          ].some((query) => query.isError) ? (
            <Alert>
              Unable to load assessment options. Close the form and try again.
            </Alert>
          ) : null}
          <section className="space-y-3">
            <h3 className="font-semibold">Assessment target</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="targetType" label="Target type">
                <Select id="targetType" {...register("targetType")}>
                  <option value="asset">Asset</option>
                  <option value="business_process">Business process</option>
                </Select>
              </FormField>
              <div className="space-y-2 sm:col-span-2">
                <Input
                  aria-label="Search assessment targets"
                  placeholder="Search targets by code or name"
                  value={targetSearch}
                  onChange={(event) => {
                    setTargetSearch(event.target.value);
                    setTargetPage(1);
                  }}
                />
                <div className="flex items-center justify-between text-xs">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={targetPage <= 1}
                    onClick={() => setTargetPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {targetPage} of{" "}
                    {Math.max(
                      (targetType === "asset"
                        ? assetOptions.data?.pagination.totalPages
                        : processOptions.data?.pagination.totalPages) ?? 0,
                      1,
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      targetPage >=
                      ((targetType === "asset"
                        ? assetOptions.data?.pagination.totalPages
                        : processOptions.data?.pagination.totalPages) ?? 0)
                    }
                    onClick={() => setTargetPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
              {targetType === "asset" ? (
                <FormField
                  id="assetId"
                  label="Asset"
                  error={errors.assetId?.message}
                >
                  <Select
                    id="assetId"
                    disabled={assetOptions.isPending}
                    {...register("assetId")}
                  >
                    <option value="">Select an active asset</option>
                    {assetOptions.data?.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : (
                <FormField
                  id="businessProcessId"
                  label="Business process"
                  error={errors.businessProcessId?.message}
                >
                  <Select
                    id="businessProcessId"
                    disabled={processOptions.isPending}
                    {...register("businessProcessId")}
                  >
                    <option value="">Select an active business process</option>
                    {processOptions.data?.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Risk information</h3>
            <FormField id="title" label="Title" error={errors.title?.message}>
              <Input
                id="title"
                maxLength={255}
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
            </FormField>
            <FormField
              id="description"
              label="Description"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                maxLength={5000}
                {...register("description")}
              />
            </FormField>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Risk analysis</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="likelihood" label="Likelihood">
                <Select id="likelihood" {...register("likelihood")}>
                  <option value="1">1 — Rare</option>
                  <option value="2">2 — Unlikely</option>
                  <option value="3">3 — Possible</option>
                  <option value="4">4 — Likely</option>
                  <option value="5">5 — Almost certain</option>
                </Select>
              </FormField>
              <FormField id="impact" label="Impact">
                <Select id="impact" {...register("impact")}>
                  <option value="1">1 — Insignificant</option>
                  <option value="2">2 — Minor</option>
                  <option value="3">3 — Moderate</option>
                  <option value="4">4 — Major</option>
                  <option value="5">5 — Severe</option>
                </Select>
              </FormField>
              <div className="bg-neutral-soft rounded-lg p-3">
                <p className="text-muted text-xs font-medium uppercase">
                  Preview
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {score} — {level}
                </p>
                <p className="text-muted text-xs">
                  The final risk score and level will be calculated
                  automatically when saved.
                </p>
              </div>
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <OptionChecks
              title="Threats"
              name="threatIds"
              options={threatOptions.data?.items ?? []}
              register={register}
              search={threatSearch}
              onSearch={(value) => {
                setThreatSearch(value);
                setThreatPage(1);
              }}
              page={threatPage}
              pageCount={threatOptions.data?.pagination.totalPages ?? 0}
              onPage={setThreatPage}
              selectedIds={selectedThreats ?? []}
              notes={threatNotes}
              onNote={(id, value) =>
                setThreatNotes((current) => ({ ...current, [id]: value }))
              }
              {...(errors.threatIds?.message
                ? { error: errors.threatIds.message }
                : {})}
            />
            <OptionChecks
              title="Vulnerabilities"
              name="vulnerabilityIds"
              options={vulnerabilityOptions.data?.items ?? []}
              register={register}
              search={vulnerabilitySearch}
              onSearch={(value) => {
                setVulnerabilitySearch(value);
                setVulnerabilityPage(1);
              }}
              page={vulnerabilityPage}
              pageCount={vulnerabilityOptions.data?.pagination.totalPages ?? 0}
              onPage={setVulnerabilityPage}
              selectedIds={selectedVulnerabilities ?? []}
              notes={vulnerabilityNotes}
              onNote={(id, value) =>
                setVulnerabilityNotes((current) => ({
                  ...current,
                  [id]: value,
                }))
              }
              {...(errors.vulnerabilityIds?.message
                ? { error: errors.vulnerabilityIds.message }
                : {})}
            />
          </div>
          <p className="text-muted text-xs">
            At least one threat and one vulnerability are required.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                assetOptions.isPending ||
                processOptions.isPending ||
                threatOptions.isPending ||
                vulnerabilityOptions.isPending
              }
            >
              {mutation.isPending ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function OptionChecks({
  title,
  name,
  options,
  register,
  search,
  onSearch,
  page,
  pageCount,
  onPage,
  selectedIds,
  notes,
  onNote,
  error,
}: {
  title: string;
  name: "threatIds" | "vulnerabilityIds";
  options: { id: string; code: string; name: string }[];
  register: ReturnType<
    typeof useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>
  >["register"];
  search: string;
  onSearch: (value: string) => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  selectedIds: string[];
  notes: Record<string, string>;
  onNote: (id: string, value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="font-semibold">{title}</legend>
      <Input
        className="mt-3"
        aria-label={`Search ${title}`}
        placeholder={`Search ${title.toLowerCase()}`}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <div className="border-border mt-3 max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
        {options.length ? (
          options.map((item) => (
            <label
              className="hover:bg-neutral-soft flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm"
              key={item.id}
            >
              <input
                className="mt-0.5 size-4"
                type="checkbox"
                value={item.id}
                {...register(name)}
              />
              <span>
                <span className="font-medium">{item.code}</span> — {item.name}
              </span>
              {selectedIds.includes(item.id) ? (
                <Textarea
                  className="mt-2"
                  maxLength={1000}
                  aria-label={`Notes for ${item.code}`}
                  placeholder="Optional notes"
                  value={notes[item.id] ?? ""}
                  onChange={(event) => onNote(item.id, event.target.value)}
                />
              ) : null}
            </label>
          ))
        ) : (
          <p className="text-muted p-2 text-sm">No options available</p>
        )}
      </div>
      {error ? (
        <p className="text-danger mt-1 text-xs" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between text-xs">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </fieldset>
  );
}
