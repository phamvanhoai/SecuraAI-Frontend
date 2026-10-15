"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pagination } from "@/components/data-display/pagination";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useIncidentRiskOptions,
  useLinkIncidentToRisk,
  useUnlinkIncidentFromRisk,
} from "../hooks/use-incidents";
import {
  linkIncidentRiskFormSchema,
  type LinkIncidentRiskForm,
} from "../schemas/incident-risk-schema";
import type { Incident } from "../schemas/report-incident-schema";
const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export function LinkIncidentRiskDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [availableDraft, setAvailableDraft] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [linkedDraft, setLinkedDraft] = useState("");
  const [linkedSearch, setLinkedSearch] = useState("");
  const [linkedPage, setLinkedPage] = useState(1);
  const [unlinkTargetId, setUnlinkTargetId] = useState<string>();
  const options = useIncidentRiskOptions(incident?.id, {
    q: availableSearch,
    scope: "unlinked",
    page: availablePage,
    limit: 10,
  });
  const linkedOptions = useIncidentRiskOptions(incident?.id, {
    q: linkedSearch,
    scope: "linked",
    page: linkedPage,
    limit: 5,
  });
  const mutation = useLinkIncidentToRisk();
  const unlinkMutation = useUnlinkIncidentFromRisk();
  const toast = useToast();
  const form = useForm<LinkIncidentRiskForm>({
    resolver: zodResolver(linkIncidentRiskFormSchema),
    defaultValues: { riskId: "" },
  });
  const available = options.data?.risks ?? [];
  const linked = linkedOptions.data?.risks ?? [];
  const hasLinked = incident ? incident.relatedCounts.risks > 0 : false;
  useEffect(() => {
    if (incident) {
      form.reset({ riskId: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, incident]);
  const close = () => {
    setUnlinkTargetId(undefined);
    setAvailableDraft("");
    setAvailableSearch("");
    setAvailablePage(1);
    setLinkedDraft("");
    setLinkedSearch("");
    setLinkedPage(1);
    onClose();
  };
  const submit = async (values: LinkIncidentRiskForm) => {
    if (!incident) return;
    try {
      const linked = await mutation.mutateAsync({ id: incident.id, values });
      toast.success(
        "Risk linked",
        `${linked.risk.riskCode} is now linked to ${linked.incident.incidentCode}.`,
      );
      close();
    } catch {
      /* normalized error remains visible */
    }
  };
  const unlink = async (riskId: string) => {
    if (!incident) return;
    const risk = linked.find((item) => item.id === riskId);
    try {
      await unlinkMutation.mutateAsync({ incidentId: incident.id, riskId });
      toast.success(
        "Risk unlinked",
        `${risk?.riskCode ?? "The risk"} is no longer linked to ${incident.incidentCode}.`,
      );
      setUnlinkTargetId(undefined);
    } catch {
      /* normalized error remains visible */
    }
  };
  return (
    <Dialog
      dialogRef={ref}
      title={hasLinked ? "Link another risk" : "Link incident to existing risk"}
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
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
          {options.isError || linkedOptions.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load existing risks. Check your session and backend
              connection.
            </Alert>
          ) : null}
          {unlinkMutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {unlinkMutation.error instanceof Error
                ? unlinkMutation.error.message
                : "Unable to unlink this risk."}
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to link this risk."}
            </Alert>
          ) : null}
          {hasLinked ? (
            <section
              aria-labelledby="linked-risks-heading"
              className="border-border rounded-lg border"
            >
              <div className="border-border border-b px-4 py-3">
                <h3 id="linked-risks-heading" className="text-sm font-semibold">
                  Already linked risks
                </h3>
                <p className="text-muted mt-0.5 text-xs">
                  These risks already provide context for this incident.
                </p>
                <div className="mt-3 flex gap-2">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Search linked risks</span>
                    <Search
                      aria-hidden="true"
                      className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Input
                      className="min-h-10 pl-9"
                      onChange={(event) => setLinkedDraft(event.target.value)}
                      placeholder="Search linked risks"
                      value={linkedDraft}
                    />
                  </label>
                  <Button
                    aria-label="Search linked risks"
                    onClick={() => {
                      setLinkedSearch(linkedDraft.trim());
                      setLinkedPage(1);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Search
                  </Button>
                </div>
              </div>
              {linkedOptions.isPending ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  Loading linked risks…
                </p>
              ) : linked.length === 0 ? (
                <p className="text-muted px-4 py-6 text-center text-sm">
                  No linked risks match this search.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {linked.map((risk) => (
                    <li className="px-4 py-3 text-sm" key={risk.id}>
                      <div className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block font-medium">
                            {risk.title}
                          </span>
                          <span className="text-muted text-xs">
                            {risk.riskCode} · {title(risk.status)}
                          </span>
                        </span>
                        <button
                          className="text-danger min-h-8 px-2 text-xs font-semibold"
                          onClick={() => setUnlinkTargetId(risk.id)}
                          type="button"
                        >
                          Unlink
                        </button>
                      </div>
                      {unlinkTargetId === risk.id ? (
                        <div className="border-danger/20 bg-danger-soft mt-3 rounded-md border p-3">
                          <p className="font-medium">Remove this risk link?</p>
                          <p className="text-muted mt-1 text-xs">
                            The risk and incident records will not be deleted.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              onClick={() => setUnlinkTargetId(undefined)}
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={unlinkMutation.isPending}
                              onClick={() => void unlink(risk.id)}
                              variant="danger"
                            >
                              {unlinkMutation.isPending
                                ? "Unlinking…"
                                : "Remove link"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {linkedOptions.data &&
              linkedOptions.data.pagination.totalPages > 1 ? (
                <div className="border-border border-t px-4 py-3">
                  <Pagination
                    onPageChange={setLinkedPage}
                    page={linkedOptions.data.pagination.page}
                    pageCount={linkedOptions.data.pagination.totalPages}
                  />
                </div>
              ) : null}
            </section>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="risk-search">
              Search available risks
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  className="pl-9"
                  id="risk-search"
                  onChange={(event) => setAvailableDraft(event.target.value)}
                  placeholder="Search by risk code or title"
                  value={availableDraft}
                />
              </div>
              <Button
                aria-label="Search available risks"
                onClick={() => {
                  setAvailableSearch(availableDraft.trim());
                  setAvailablePage(1);
                  form.reset({ riskId: "" });
                }}
                type="button"
                variant="secondary"
              >
                Search
              </Button>
            </div>
          </div>
          <FormField
            id="incident-risk"
            label={hasLinked ? "Additional risk" : "Existing risk"}
            error={form.formState.errors.riskId?.message}
          >
            <Select
              id="incident-risk"
              autoFocus
              disabled={
                options.isPending || options.isError || available.length === 0
              }
              aria-invalid={Boolean(form.formState.errors.riskId)}
              {...form.register("riskId")}
            >
              <option value="">
                {options.isPending
                  ? "Loading existing risks…"
                  : "Select an existing risk"}
              </option>
              {available.map((risk) => (
                <option key={risk.id} value={risk.id}>
                  {risk.riskCode} — {risk.title} ({title(risk.status)})
                </option>
              ))}
            </Select>
            {!options.isPending &&
            !options.isError &&
            available.length === 0 ? (
              <p className="text-muted text-xs">
                All available risks are already linked to this incident.
              </p>
            ) : (
              <p className="text-muted text-xs">
                This records incident context only. Risk reassessment remains a
                separate reviewed action.
              </p>
            )}
          </FormField>
          {options.data && options.data.pagination.totalPages > 1 ? (
            <Pagination
              onPageChange={(page) => {
                setAvailablePage(page);
                form.reset({ riskId: "" });
              }}
              page={options.data.pagination.page}
              pageCount={options.data.pagination.totalPages}
            />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || available.length === 0}
            >
              {mutation.isPending
                ? "Linking…"
                : hasLinked
                  ? "Link another risk"
                  : "Link risk"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
