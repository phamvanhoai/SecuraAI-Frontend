"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/api-error";
import {
  useCloseIncident,
  useIncidentClosure,
} from "../hooks/use-incident-closure";
import { closureFormSchema } from "../schemas/incident-closure-schema";
import type { Incident } from "../schemas/report-incident-schema";

export function CloseIncidentDialog({
  incident,
  onClose,
}: {
  incident: Incident | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const query = useIncidentClosure(incident?.id);
  const mutation = useCloseIncident();
  const toast = useToast();
  const [summary, setSummary] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [reviewedVersion, setReviewedVersion] = useState<string>();
  useEffect(() => {
    if (incident && !ref.current?.open) {
      setSummary("");
      setConfirmed(false);
      setError("");
      setReviewedVersion(undefined);
      ref.current?.showModal();
    } else if (!incident) ref.current?.close();
  }, [incident]);
  const close = () => {
    if (!mutation.isPending) onClose();
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = closureFormSchema.safeParse({ summary, confirmed });
    if (!values.success) {
      setError(
        "Enter a closure summary of 20–4000 characters and confirm readiness.",
      );
      return;
    }
    if (!incident || !query.data?.canClose || mutation.isPending) return;
    if (reviewedVersion !== query.data.expectedUpdatedAt) {
      setConfirmed(false);
      setError(
        "The incident changed. Review the latest information and confirm again.",
      );
      return;
    }
    setError("");
    try {
      const result = await mutation.mutateAsync({
        id: incident.id,
        values: values.data,
        expectedUpdatedAt: reviewedVersion,
      });
      toast.success(
        result.changed ? "Incident closed" : "Incident already closed",
      );
      setConfirmed(false);
    } catch (failure) {
      setConfirmed(false);
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Unable to close incident. Please try again.",
      );
    }
  };
  const data = query.data;
  return (
    <Dialog
      dialogRef={ref}
      title={data?.status === "closed" ? "Incident closure" : "Close incident"}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {incident ? (
        <div className="space-y-5">
          <div className="border-border border-b pb-4">
            <p className="text-muted font-mono text-xs">
              {incident.incidentCode}
            </p>
            <p className="mt-1 font-semibold break-words">{incident.title}</p>
          </div>
          {query.isPending ? (
            <Skeleton className="h-40" />
          ) : query.isError ? (
            <Alert role="alert">
              Unable to load closure information.{" "}
              <Button variant="secondary" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </Alert>
          ) : data?.status === "closed" ? (
            <div className="space-y-4">
              <Alert>
                Closed. Response and handling history are retained for audit.
              </Alert>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Closed at</dt>
                  <dd>
                    {data.closedAt
                      ? new Date(data.closedAt).toLocaleString()
                      : "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Closed by</dt>
                  <dd>{data.closure?.closedBy?.name ?? "Not recorded"}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold">Closure summary</h3>
                <p className="mt-2 text-sm break-words whitespace-pre-wrap">
                  {data.closure?.summary ??
                    "No closure audit summary is available for this existing record."}
                </p>
              </div>
            </div>
          ) : data ? (
            <form onSubmit={submit} className="space-y-4">
              <Alert>
                {data.restriction ??
                  "Closing ends active handling. Verify response and recovery results and the saved root cause, lessons learned and improvement recommendations. Closure time is recorded by the server."}
              </Alert>
              <div className="space-y-1.5">
                <Label htmlFor="incident-closure-summary">
                  Closure summary
                </Label>
                <Textarea
                  id="incident-closure-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  minLength={20}
                  maxLength={4000}
                  required
                  disabled={!data.canClose || mutation.isPending}
                  aria-describedby="incident-closure-hint"
                />
                <p id="incident-closure-hint" className="text-muted text-xs">
                  Describe the response outcome, recovery validation and any
                  documented follow-up.
                </p>
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={
                    confirmed && reviewedVersion === data.expectedUpdatedAt
                  }
                  disabled={!data.canClose || mutation.isPending}
                  onChange={(event) => {
                    setConfirmed(event.target.checked);
                    setReviewedVersion(data.expectedUpdatedAt);
                  }}
                />
                <span>
                  I confirm required response and recovery activities are
                  complete and necessary information is recorded.
                </span>
              </label>
              {error ? <Alert role="alert">{error}</Alert> : null}
              <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !data.canClose ||
                    !confirmed ||
                    reviewedVersion !== data.expectedUpdatedAt ||
                    mutation.isPending
                  }
                >
                  {mutation.isPending ? "Closing…" : "Close incident"}
                </Button>
              </div>
            </form>
          ) : null}
          {query.isPending || query.isError || data?.status === "closed" ? (
            <div className="border-border flex justify-end border-t pt-4">
              <Button
                variant="secondary"
                onClick={close}
                disabled={mutation.isPending}
              >
                Close
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
