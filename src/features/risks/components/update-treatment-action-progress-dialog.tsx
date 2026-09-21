"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useUpdateTreatmentActionProgress } from "../hooks/use-update-treatment-action-progress";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";
import { updateTreatmentActionProgressRequestSchema } from "../schemas/update-treatment-action-progress-schema";

export function UpdateTreatmentActionProgressDialog({
  treatmentPlanId, action, onClose, onReload,
}: {
  treatmentPlanId: string;
  action: TreatmentPlanDetail["actions"][number];
  onClose: () => void;
  onReload: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(String(action.progressPercent));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [needsReload, setNeedsReload] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const mutation = useUpdateTreatmentActionProgress(treatmentPlanId);
  const toast = useToast();
  const percent = progress.trim() === "" ? NaN : Number(progress);
  const reducing = percent < action.progressPercent;
  const normalizedNote = note.trim();
  const validProgress = Number.isInteger(percent) && percent >= 0 && percent <= 100;
  const noteError = (reducing || normalizedNote.length > 0) && normalizedNote.length < 10;
  const dirty = progress !== String(action.progressPercent) || note.length > 0;
  const status = !validProgress ? "Enter a valid percentage" : percent === 100 ? "Completed" : percent === 0 ? "Pending" : "In progress";

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const close = (): void => {
    if (submitting.current || mutation.isPending) return;
    if (dirty) setDiscarding(true);
    else onClose();
  };
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (submitting.current || needsReload || !validProgress || noteError) return;
    const parsed = updateTreatmentActionProgressRequestSchema.safeParse({
      expectedUpdatedAt: action.updatedAt,
      progressPercent: percent,
      ...(normalizedNote ? { progressNote: normalizedNote } : {}),
    });
    if (!parsed.success) { setError("Check the progress and note before saving."); return; }
    submitting.current = true;
    setError(undefined);
    try {
      const result = await mutation.mutateAsync({ treatmentPlanId, actionId: action.id, data: parsed.data });
      toast.success("Action progress updated", result.allActionsCompleted
        ? "All active actions are complete. The risk still requires review before closure."
        : `${action.title}: ${result.progressPercent}% complete.`);
      onClose();
    } catch (cause: unknown) {
      const stale = cause instanceof ApiError && [403, 404, 409].includes(cause.status);
      setNeedsReload(stale);
      setError(cause instanceof ApiError && cause.status !== 0
        ? cause.message
        : "Unable to confirm the update. Reload the plan to check its latest progress before trying again.");
      if (cause instanceof ApiError && (cause.status === 0 || cause.status >= 500)) setNeedsReload(true);
    } finally { submitting.current = false; }
  };

  return (
    <Dialog title="Update action progress" dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      onCancel={(event) => { event.preventDefault(); close(); }}>
      <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        <div>
          <p className="font-medium wrap-anywhere">{action.title}</p>
          <p className="text-muted mt-1 text-sm">Current progress: {action.progressPercent}%</p>
        </div>
        {error ? <div ref={errorRef} tabIndex={-1} role="alert"><Alert className="border-danger/25 bg-danger-soft text-danger">{error}</Alert></div> : null}
        <fieldset disabled={mutation.isPending || needsReload} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="action-progress-percent" className="text-sm font-medium">Progress (%)</label>
            <Input id="action-progress-percent" type="number" min={0} max={100} step={1}
              value={progress} onChange={(event) => { setProgress(event.target.value); setDiscarding(false); }}
              aria-invalid={!validProgress} aria-describedby="action-progress-help" />
            <p id="action-progress-help" className={validProgress ? "text-muted text-xs" : "text-danger text-xs"}>
              {validProgress ? `Status after saving: ${status}.` : "Enter a whole number from 0 to 100."}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="action-progress-note" className="text-sm font-medium">Progress note {reducing ? "(required)" : "(optional)"}</label>
            <Textarea id="action-progress-note" maxLength={1000} value={note}
              onChange={(event) => { setNote(event.target.value); setDiscarding(false); }}
              aria-invalid={noteError} aria-describedby="action-progress-note-help" />
            <p id="action-progress-note-help" className={noteError ? "text-danger text-xs" : "text-muted text-xs"}>
              {reducing ? "Explain why progress is being reduced (10–1000 characters)." : "If provided, enter 10–1000 characters. Notes are retained in the audit log."}
            </p>
          </div>
        </fieldset>
        {percent === 100 ? <p className="text-muted text-sm">Completing this action does not close the risk assessment.</p> : null}
        {discarding ? <Alert>
          <p>Discard your unsaved progress update?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setDiscarding(false)}>Keep editing</Button>
            <Button type="button" variant="danger" onClick={onClose}>Discard changes</Button>
          </div>
        </Alert> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={close}>Cancel</Button>
          {needsReload ? <Button type="button" onClick={onReload}>Reload plan</Button> :
            <Button type="submit" disabled={mutation.isPending || !validProgress || noteError || !dirty}>
              {mutation.isPending ? "Saving..." : "Save progress"}
            </Button>}
        </div>
      </form>
    </Dialog>
  );
}
