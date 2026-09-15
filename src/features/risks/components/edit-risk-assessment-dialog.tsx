"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
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
  const [threatSearch, setThreatSearch] = useState("");
  const [vulnerabilitySearch, setVulnerabilitySearch] = useState("");
  const [threatPage, setThreatPage] = useState(1);
  const [vulnerabilityPage, setVulnerabilityPage] = useState(1);
  const [threatNotes, setThreatNotes] = useState<Record<string, string>>({});
  const [vulnerabilityNotes, setVulnerabilityNotes] = useState<
    Record<string, string>
  >({});
  const detail = useRiskAssessmentDetail(id);
  const assetOptions = useRiskCreateOptions("assets", id !== null);
  const processOptions = useRiskCreateOptions("businessProcesses", id !== null);
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
  const [targetType, likelihoodValue, impactValue] = useWatch({
    control,
    name: ["targetType", "likelihood", "impact"],
  });
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
    setThreatNotes(
      Object.fromEntries(
        data.threats.map((item) => [item.id, item.notes ?? ""]),
      ),
    );
    setVulnerabilityNotes(
      Object.fromEntries(
        data.vulnerabilities.map((item) => [item.id, item.notes ?? ""]),
      ),
    );
  }, [detail.data, reset]);
  const close = (): void => {
    setMessage(undefined);
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
        notes: threatNotes[threatId]?.trim() || null,
      })),
      vulnerabilities: values.vulnerabilityIds.map((vulnerabilityId) => ({
        vulnerabilityId,
        notes: vulnerabilityNotes[vulnerabilityId]?.trim() || null,
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="editTargetType" label="Target type">
                <Select id="editTargetType" {...register("targetType")}>
                  <option value="asset">Asset</option>
                  <option value="business_process">Business process</option>
                </Select>
              </FormField>
              {targetType === "asset" ? (
                <FormField
                  id="editAssetId"
                  label="Asset"
                  error={errors.assetId?.message}
                >
                  <Select id="editAssetId" {...register("assetId")}>
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
                  id="editProcessId"
                  label="Business process"
                  error={errors.businessProcessId?.message}
                >
                  <Select id="editProcessId" {...register("businessProcessId")}>
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
              register={register}
              search={threatSearch}
              onSearch={(value) => {
                setThreatSearch(value);
                setThreatPage(1);
              }}
              page={threatPage}
              pageCount={threatOptions.data?.pagination.totalPages ?? 0}
              onPage={setThreatPage}
              notes={threatNotes}
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
              register={register}
              search={vulnerabilitySearch}
              onSearch={(value) => {
                setVulnerabilitySearch(value);
                setVulnerabilityPage(1);
              }}
              page={vulnerabilityPage}
              pageCount={vulnerabilityOptions.data?.pagination.totalPages ?? 0}
              onPage={setVulnerabilityPage}
              notes={vulnerabilityNotes}
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
        {options.map((item) => (
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
