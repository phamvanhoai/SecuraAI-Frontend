"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRiskAssessmentDetail } from "../hooks/use-risk-assessment-detail";
import { useRiskCreateOptions } from "../hooks/use-create-risk-assessment";
import { useUpdateRiskAssessment } from "../hooks/use-update-risk-assessment";
import {
  updateRiskAssessmentFormSchema,
  type UpdateRiskAssessmentForm,
  type UpdateRiskAssessmentInput,
  type UpdateRiskAssessmentRequest,
} from "../schemas/update-risk-assessment-schema";

const defaults: UpdateRiskAssessmentInput = {
  targetType: "asset",
  assetId: "",
  businessProcessId: "",
  title: "",
  description: "",
  likelihood: 3,
  impact: 3,
  threatIds: [],
  vulnerabilityIds: [],
  expectedUpdatedAt: "",
};
export function EditRiskAssessmentDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [targetSearch, setTargetSearch] = useState("");
  const [debouncedTargetSearch, setDebouncedTargetSearch] = useState("");
  const [threatSearch, setThreatSearch] = useState("");
  const [vulnerabilitySearch, setVulnerabilitySearch] = useState("");
  const [threatPage, setThreatPage] = useState(1);
  const [vulnerabilityPage, setVulnerabilityPage] = useState(1);
  const [threatNotes, setThreatNotes] = useState<Record<string, string>>({});
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState<
    Record<string, string>
  >({});
  const detail = useRiskAssessmentDetail(id);
  const threatOptions = useRiskCreateOptions(
    "threats",
    id !== null,
    threatSearch,
    threatPage,
  );
  const vulnerabilityOptions = useRiskCreateOptions(
    "vulnerabilities",
    id !== null,
    vulnerabilitySearch,
    vulnerabilityPage,
  );
  const mutation = useUpdateRiskAssessment();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<UpdateRiskAssessmentInput, unknown, UpdateRiskAssessmentForm>({
    resolver: zodResolver(updateRiskAssessmentFormSchema),
    defaultValues: defaults,
  });
  const [
    targetType,
    assetId,
    businessProcessId,
    likelihoodValue,
    impactValue,
    threatIds,
    vulnerabilityIds,
  ] = useWatch({
    control,
    name: [
      "targetType",
      "assetId",
      "businessProcessId",
      "likelihood",
      "impact",
      "threatIds",
      "vulnerabilityIds",
    ],
  });
  const assetOptions = useRiskCreateOptions(
    "assets",
    id !== null && targetType === "asset",
    debouncedTargetSearch,
  );
  const processOptions = useRiskCreateOptions(
    "businessProcesses",
    id !== null && targetType === "business_process",
    debouncedTargetSearch,
  );
  const score = Number(likelihoodValue) * Number(impactValue);
  const level =
    score <= 4
      ? "Low"
      : score <= 9
        ? "Medium"
        : score <= 16
          ? "High"
          : "Critical";
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedTargetSearch(targetSearch),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [targetSearch]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (id && !dialog.open) dialog.showModal();
    if (!id && dialog.open) dialog.close();
  }, [id]);
  useEffect(() => {
    const data = detail.data;
    if (!data) return;
    reset({
      targetType: data.target.type === "asset" ? "asset" : "business_process",
      assetId: data.target.type === "asset" ? data.target.id : "",
      businessProcessId:
        data.target.type === "businessProcess" ? data.target.id : "",
      title: data.assessment.title,
      description: data.assessment.description ?? "",
      likelihood: data.inherentRisk.likelihood,
      impact: data.inherentRisk.impact,
      threatIds: data.threats.map(({ id: threatId }) => threatId),
      vulnerabilityIds: data.vulnerabilities.map(
        ({ id: vulnerabilityId }) => vulnerabilityId,
      ),
      expectedUpdatedAt: data.assessment.updatedAt,
    });
  }, [detail.data, reset]);
  const close = (): void => {
    setMessage(undefined);
    setTargetSearch("");
    setDebouncedTargetSearch("");
    setThreatNotes({});
    setVulnerabilityNotes({});
    onClose();
  };
  const submit = async (values: UpdateRiskAssessmentForm): Promise<void> => {
    if (!id || !detail.data) return;
    setMessage(undefined);
    const input: UpdateRiskAssessmentRequest = {
      title: values.title,
      description: values.description || null,
      likelihood: values.likelihood,
      impact: values.impact,
      expectedUpdatedAt: values.expectedUpdatedAt,
      threats: values.threatIds.map((threatId) => ({
        threatId,
        notes: Object.hasOwn(threatNotes, threatId)
          ? threatNotes[threatId]?.trim() || null
          : detail.data.threats
              .find(({ id: linkedId }) => linkedId === threatId)
              ?.notes?.trim() || null,
      })),
      vulnerabilities: values.vulnerabilityIds.map((vulnerabilityId) => ({
        vulnerabilityId,
        notes: Object.hasOwn(vulnerabilityNotes, vulnerabilityId)
          ? vulnerabilityNotes[vulnerabilityId]?.trim() || null
          : detail.data.vulnerabilities
              .find(({ id: linkedId }) => linkedId === vulnerabilityId)
              ?.notes?.trim() || null,
      })),
      ...(values.targetType === "asset" && values.assetId
        ? { assetId: values.assetId }
        : {}),
      ...(values.targetType === "business_process" && values.businessProcessId
        ? { businessProcessId: values.businessProcessId }
        : {}),
    };
    try {
      const updated = await mutation.mutateAsync({ id, input });
      toast.success(
        "Risk assessment updated",
        `${updated.assessment.riskCode} was updated.`,
      );
      close();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update risk assessment.",
      );
    }
  };
  return (
    <Dialog
      title="Edit Risk Assessment"
      dialogRef={ref}
      onClose={close}
      className="max-h-[90vh] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      {detail.isPending ? (
        <p className="text-muted py-10 text-center">
          Loading current assessment…
        </p>
      ) : null}
      {detail.isError ||
      [assetOptions, processOptions, threatOptions, vulnerabilityOptions].some(
        (query) => query.isError,
      ) ? (
        <Alert>
          <strong className="block">Unable to edit this assessment</strong>
          <span>Reload the assessment and try again.</span>
        </Alert>
      ) : null}
      {detail.data &&
      !["draft", "rejected"].includes(detail.data.assessment.status) ? (
        <Alert>Only draft or rejected risk assessments can be edited.</Alert>
      ) : null}
      {detail.data &&
      ["draft", "rejected"].includes(detail.data.assessment.status) ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <section className="space-y-3">
            <h3 className="font-semibold">Assessment target</h3>
            <div className="space-y-4">
              <FormField id="editTargetType" label="Target type">
                <Select
                  id="editTargetType"
                  disabled={detail.data.assessment.status === "rejected"}
                  {...register("targetType")}
                >
                  <option value="asset">Asset</option>
                  <option value="business_process">Business process</option>
                </Select>
              </FormField>
              {detail.data.assessment.status === "draft" ? (
                <Input
                  aria-label="Search assessment targets"
                  placeholder="Search targets by code or name"
                  value={targetSearch}
                  onChange={(event) => setTargetSearch(event.target.value)}
                />
              ) : null}
              <TargetChoices
                name={targetType === "asset" ? "assetId" : "businessProcessId"}
                options={
                  targetType === "asset"
                    ? (assetOptions.data?.items ?? [])
                    : (processOptions.data?.items ?? [])
                }
                current={
                  (targetType === "asset" && detail.data.target.type === "asset") ||
                  (targetType === "business_process" &&
                    detail.data.target.type === "businessProcess")
                    ? detail.data.target
                    : null
                }
                selectedId={
                  targetType === "asset"
                    ? typeof assetId === "string"
                      ? assetId
                      : ""
                    : typeof businessProcessId === "string"
                      ? businessProcessId
                      : ""
                }
                register={register}
                disabled={detail.data.assessment.status === "rejected"}
                loading={
                  targetType === "asset"
                    ? assetOptions.isPending
                    : processOptions.isPending
                }
                {...(targetType === "asset" &&
                typeof errors.assetId?.message === "string"
                  ? { error: errors.assetId.message }
                  : targetType === "business_process" &&
                      typeof errors.businessProcessId?.message === "string"
                    ? { error: errors.businessProcessId.message }
                    : {})}
              />
            </div>
            {detail.data.assessment.status === "rejected" ? (
              <p className="text-muted text-xs">
                The assessment target is locked after rejection to preserve its review history.
              </p>
            ) : null}
          </section>
          <FormField id="editTitle" label="Title" error={errors.title?.message}>
            <Input id="editTitle" maxLength={255} {...register("title")} />
          </FormField>
          <FormField
            id="editDescription"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="editDescription"
              maxLength={5000}
              {...register("description")}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="editLikelihood" label="Likelihood">
              <Select id="editLikelihood" {...register("likelihood")}>
                <option value="1">1 — Rare</option>
                <option value="2">2 — Unlikely</option>
                <option value="3">3 — Possible</option>
                <option value="4">4 — Likely</option>
                <option value="5">5 — Almost certain</option>
              </Select>
            </FormField>
            <FormField id="editImpact" label="Impact">
              <Select id="editImpact" {...register("impact")}>
                <option value="1">1 — Insignificant</option>
                <option value="2">2 — Minor</option>
                <option value="3">3 — Moderate</option>
                <option value="4">4 — Major</option>
                <option value="5">5 — Severe</option>
              </Select>
            </FormField>
            <div className="bg-neutral-soft rounded-lg p-3">
              <p className="text-muted text-xs uppercase">Preview</p>
              <p className="mt-1 font-semibold">
                {score} — {level}
              </p>
              <p className="text-muted text-xs">
                The final risk score and level will be calculated automatically
                when saved.
              </p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Checks
              title="Threats"
              name="threatIds"
              options={threatOptions.data?.items ?? []}
              selectedOptions={detail.data.threats}
              selectedIds={threatIds ?? []}
              register={register}
              search={threatSearch}
              onSearch={(value) => {
                setThreatSearch(value);
                setThreatPage(1);
              }}
              page={threatPage}
              pageCount={threatOptions.data?.pagination.totalPages ?? 0}
              onPage={setThreatPage}
              notes={{
                ...Object.fromEntries(
                  detail.data.threats.map((item) => [
                    item.id,
                    item.notes ?? "",
                  ]),
                ),
                ...threatNotes,
              }}
              onNote={(optionId, value) =>
                setThreatNotes((current) => ({ ...current, [optionId]: value }))
              }
              {...(errors.threatIds?.message
                ? { error: errors.threatIds.message }
                : {})}
            />
            <Checks
              title="Vulnerabilities"
              name="vulnerabilityIds"
              options={vulnerabilityOptions.data?.items ?? []}
              selectedOptions={detail.data.vulnerabilities}
              selectedIds={vulnerabilityIds ?? []}
              register={register}
              search={vulnerabilitySearch}
              onSearch={(value) => {
                setVulnerabilitySearch(value);
                setVulnerabilityPage(1);
              }}
              page={vulnerabilityPage}
              pageCount={vulnerabilityOptions.data?.pagination.totalPages ?? 0}
              onPage={setVulnerabilityPage}
              notes={{
                ...Object.fromEntries(
                  detail.data.vulnerabilities.map((item) => [
                    item.id,
                    item.notes ?? "",
                  ]),
                ),
                ...vulnerabilityNotes,
              }}
              onNote={(optionId, value) =>
                setVulnerabilityNotes((current) => ({
                  ...current,
                  [optionId]: value,
                }))
              }
              {...(errors.vulnerabilityIds?.message
                ? { error: errors.vulnerabilityIds.message }
                : {})}
            />
          </div>
          <p className="text-muted text-xs">
            Concurrent changes are protected. If this assessment changed, reload
            it before saving.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
function Checks({
  title,
  name,
  options,
  selectedOptions,
  selectedIds,
  register,
  search,
  onSearch,
  page,
  pageCount,
  onPage,
  notes,
  onNote,
  error,
}: {
  title: string;
  name: "threatIds" | "vulnerabilityIds";
  options: { id: string; code: string; name: string }[];
  selectedOptions: { id: string; code: string; name: string }[];
  selectedIds: string[];
  register: UseFormRegister<UpdateRiskAssessmentInput>;
  search: string;
  onSearch: (value: string) => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  notes: Record<string, string>;
  onNote: (id: string, value: string) => void;
  error?: string;
}) {
  const visibleOptions = useMemo(() => {
    const byId = new Map(options.map((item) => [item.id, item]));
    for (const item of selectedOptions)
      if (selectedIds.includes(item.id)) byId.set(item.id, item);
    return [...byId.values()].sort((left, right) => {
      const selectedDifference =
        Number(selectedIds.includes(right.id)) -
        Number(selectedIds.includes(left.id));
      return selectedDifference || left.code.localeCompare(right.code);
    });
  }, [options, selectedIds, selectedOptions]);
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
        {visibleOptions.map((item) => (
          <label
            className="hover:bg-neutral-soft flex cursor-pointer gap-2 rounded-md p-2 text-sm"
            key={item.id}
          >
            <input
              className="mt-0.5 size-4"
              type="checkbox"
              value={item.id}
              {...register(name)}
            />
            <span>
              <strong>{item.code}</strong> — {item.name}
              {selectedIds.includes(item.id) ? (
                <span className="text-muted ml-1 text-xs">(Selected)</span>
              ) : null}
            </span>
            <Textarea
              className="mt-2"
              maxLength={1000}
              aria-label={`Notes for ${item.code}`}
              placeholder="Optional notes"
              value={notes[item.id] ?? ""}
              onChange={(event) => onNote(item.id, event.target.value)}
            />
          </label>
        ))}
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

function TargetChoices({
  name,
  options,
  current,
  selectedId,
  register,
  disabled,
  loading,
  error,
}: {
  name: "assetId" | "businessProcessId";
  options: { id: string; code: string; name: string }[];
  current: { id: string; code: string; name: string } | null;
  selectedId: string;
  register: UseFormRegister<UpdateRiskAssessmentInput>;
  disabled: boolean;
  loading: boolean;
  error?: string;
}) {
  const visible =
    current && !options.some((item) => item.id === current.id)
      ? [current, ...options]
      : options;
  return (
    <fieldset>
      <legend className="font-medium">
        {name === "assetId" ? "Asset" : "Business process"}
      </legend>
      <div className="border-border mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
        {loading ? <p className="text-muted p-2 text-sm">Loading targets…</p> : null}
        {!loading && visible.length === 0 ? (
          <p className="text-muted p-2 text-sm">No matching targets.</p>
        ) : null}
        {visible.map((item) => (
          <label
            key={item.id}
            className={`flex cursor-pointer gap-3 rounded-md p-2 text-sm ${
              selectedId === item.id
                ? "bg-neutral-soft"
                : "hover:bg-neutral-soft"
            }`}
          >
            <input
              type="radio"
              value={item.id}
              disabled={disabled}
              {...register(name)}
            />
            <span>
              <strong>{item.code}</strong> — {item.name}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-danger mt-1 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
