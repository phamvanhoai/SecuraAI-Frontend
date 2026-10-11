"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { ApiError } from "@/lib/api/api-error";
import {
  useCatalogControl,
  useControlOwners,
  useSaveCatalogControl,
} from "../hooks/use-control-catalog";
import {
  applicabilitySchema,
  implementationSchema,
  createControlSchema,
  editControlSchema,
  type CatalogControl,
  type CreateControl,
} from "../schemas/control-catalog-schema";

export function ControlEditor({
  controlId,
  onClose,
}: {
  controlId?: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const detail = useCatalogControl(controlId);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <Dialog
      dialogRef={dialog}
      title={controlId ? "Edit Control" : "Create Control"}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      onClose={onClose}
      onCancel={(event) => {
        if (controlId && !detail.data) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      {controlId && detail.isPending ? (
        <div className="space-y-4">
          <p role="status">Loading control…</p>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      ) : controlId && detail.isError ? (
        <div className="space-y-4">
          <Alert>
            Unable to load this control. Check your access and try again.
          </Alert>
          <Button variant="secondary" onClick={() => void detail.refetch()}>
            Try again
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <ControlFields
          key={controlId ?? "create"}
          {...(detail.data ? { initial: detail.data } : {})}
          dialog={dialog}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function ControlFields({
  initial,
  dialog,
  onClose,
}: {
  initial?: CatalogControl;
  dialog: React.RefObject<HTMLDialogElement | null>;
  onClose: () => void;
}) {
  // Freeze the edit baseline. A background refresh must never silently replace the expected version.
  const [baseline] = useState(initial);
  const defaults: CreateControl = {
    controlCode: baseline?.controlCode ?? "",
    name: baseline?.name ?? "",
    description: baseline?.description ?? "",
    ownerUserId: baseline?.owner?.id ?? null,
    applicability: baseline?.applicability ?? "under_review",
    implementationStatus: baseline?.implementationStatus ?? "not_implemented",
  };
  const [values, setValues] = useState(defaults);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState(false);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const save = useSaveCatalogControl();
  const toast = useToast();
  const owners = useControlOwners(q, true);
  useEffect(() => {
    const timeout = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const dirty =
    JSON.stringify(values) !== JSON.stringify(defaults) || reason !== "";
  const close = () => {
    if (
      !busy.current &&
      (!dirty || window.confirm("Discard unsaved control changes?"))
    )
      onClose();
  };
  useEffect(() => {
    const element = dialog.current;
    const cancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    element?.addEventListener("cancel", cancel);
    return () => element?.removeEventListener("cancel", cancel);
  });
  const set = <K extends keyof CreateControl>(
    key: K,
    value: CreateControl[K],
  ) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy.current || blocked) return;
    const parsed = baseline
      ? editControlSchema.safeParse({
          name: values.name,
          description: values.description,
          ownerUserId: values.ownerUserId,
          applicability: values.applicability,
          implementationStatus: values.implementationStatus,
          reason,
          expectedUpdatedAt: baseline.updatedAt,
          expectedRevision: baseline.revision,
        })
      : createControlSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      setError("Check the highlighted fields before saving.");
      const first = Object.keys(next)[0];
      if (first)
        form.current?.querySelector<HTMLElement>(`#control-${first}`)?.focus();
      return;
    }
    setErrors({});
    setError(undefined);
    busy.current = true;
    try {
      // Parse each branch separately to retain strict payload types and exclude the immutable code from Edit.
      if (baseline)
        await save.mutateAsync({
          mode: "edit",
          id: baseline.id,
          body: editControlSchema.parse(parsed.data),
        });
      else
        await save.mutateAsync({
          mode: "create",
          body: createControlSchema.parse(parsed.data),
        });
      toast.success(
        baseline ? "Control updated" : "Control created",
        "Evidence, assessments and risk ratings are unchanged.",
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to confirm the saved control. Close and reopen before trying again.",
      );
      if (
        cause instanceof ApiError &&
        ([0, 401, 403, 404, 503].includes(cause.status) ||
          (Boolean(baseline) && cause.status === 409))
      )
        setBlocked(true);
      if (!(cause instanceof ApiError)) setBlocked(true);
      if (!baseline && cause instanceof ApiError && cause.status === 409)
        setErrors({ controlCode: cause.message });
    } finally {
      busy.current = false;
    }
  };
  const message = (key: string) =>
    errors[key] ? (
      <p id={`control-${key}-error`} className="text-danger mt-1 text-sm">
        {errors[key]}
      </p>
    ) : null;
  const attributes = (key: string) => ({
    id: `control-${key}`,
    "aria-invalid": Boolean(errors[key]),
    ...(errors[key] ? { "aria-describedby": `control-${key}-error` } : {}),
  });
  return (
    <form ref={form} onSubmit={submit} noValidate className="space-y-4">
      <p className="text-muted text-sm">
        Define a reusable security control. This does not link it to a Risk, add
        Evidence, or record effectiveness. Do not repurpose an existing control
        for a different security objective.
      </p>
      {error ? (
        <Alert
          className="border-danger/25 bg-danger-soft text-danger"
          role="alert"
        >
          {error}
          {blocked
            ? " Close and reopen this form to load the current state."
            : ""}
        </Alert>
      ) : null}
      <fieldset disabled={save.isPending || blocked} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="control-controlCode">Control code *</Label>
            <Input
              {...attributes("controlCode")}
              className="mt-1.5"
              value={values.controlCode}
              readOnly={Boolean(baseline)}
              maxLength={100}
              onChange={(event) => set("controlCode", event.target.value)}
            />
            {message("controlCode")}
            <p className="text-muted mt-1 text-xs">
              Unique, uppercase when created. Cannot be changed later.
            </p>
          </div>
          <div>
            <Label htmlFor="control-name">Control name *</Label>
            <Input
              {...attributes("name")}
              className="mt-1.5"
              value={values.name}
              maxLength={255}
              onChange={(event) => set("name", event.target.value)}
            />
            {message("name")}
          </div>
        </div>
        <div>
          <Label htmlFor="control-description">Purpose and description *</Label>
          <Textarea
            {...attributes("description")}
            rows={3}
            className="mt-1.5"
            value={values.description}
            maxLength={5000}
            onChange={(event) => set("description", event.target.value)}
          />
          {message("description")}
        </div>
        <div>
          <Label htmlFor="control-owner-search">Find Control Owner</Label>
          <Input
            id="control-owner-search"
            className="mt-1.5"
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="text-muted mt-1 text-xs">
            Active Employees and Security Officers; at most 10 results. Search
            by name.
          </p>
        </div>
        <div>
          <Label htmlFor="control-ownerUserId">Control Owner (optional)</Label>
          <Select
            {...attributes("ownerUserId")}
            className="mt-1.5"
            value={values.ownerUserId ?? ""}
            onChange={(event) => set("ownerUserId", event.target.value || null)}
          >
            <option value="">Unassigned</option>
            {baseline?.owner &&
            !owners.data?.items.some(
              (value) => value.id === baseline.owner?.id,
            ) ? (
              <option value={baseline.owner.id}>
                {baseline.owner.fullName} (current
                {baseline.owner.status === "active" ? "" : ", inactive"})
              </option>
            ) : null}
            {values.ownerUserId &&
            values.ownerUserId !== baseline?.owner?.id &&
            !owners.data?.items.some(
              (value) => value.id === values.ownerUserId,
            ) ? (
              <option value={values.ownerUserId}>Selected owner</option>
            ) : null}
            {owners.data?.items.map((value) => (
              <option key={value.id} value={value.id}>
                {value.fullName}
              </option>
            ))}
          </Select>
          {message("ownerUserId")}
          {owners.isPending ? (
            <p role="status" className="text-muted mt-1 text-xs">
              Loading owners…
            </p>
          ) : owners.isError ? (
            <p className="text-danger mt-1 text-sm">
              Unable to load owners.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => void owners.refetch()}
              >
                Try again
              </button>
            </p>
          ) : !owners.data?.items.length ? (
            <p className="text-muted mt-1 text-xs">
              No eligible owners match this search.
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="control-applicability">Applicability *</Label>
            <Select
              {...attributes("applicability")}
              className="mt-1.5"
              disabled={baseline?.configurationLocked}
              value={values.applicability}
              onChange={(event) => {
                const parsed = applicabilitySchema.safeParse(
                  event.target.value,
                );
                if (parsed.success) set("applicability", parsed.data);
              }}
            >
              {applicabilitySchema.options.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            {message("applicability")}
          </div>
          <div>
            <Label htmlFor="control-implementationStatus">
              Implementation status *
            </Label>
            <Select
              {...attributes("implementationStatus")}
              className="mt-1.5"
              disabled={baseline?.configurationLocked}
              value={values.implementationStatus}
              onChange={(event) => {
                const parsed = implementationSchema.safeParse(
                  event.target.value,
                );
                if (parsed.success) set("implementationStatus", parsed.data);
              }}
            >
              {implementationSchema.options.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            {message("implementationStatus")}
          </div>
        </div>
        {baseline?.configurationLocked ? (
          <Alert>
            Applicability and implementation are locked because assessments
            already exist. Editing metadata or ownership preserves those
            historical results.
          </Alert>
        ) : null}
        {baseline ? (
          <div>
            <Label htmlFor="control-reason">Reason for change *</Label>
            <Textarea
              {...attributes("reason")}
              rows={2}
              className="mt-1.5"
              value={reason}
              maxLength={2000}
              onChange={(event) => setReason(event.target.value)}
            />
            {message("reason")}
            <p className="text-muted mt-1 text-xs">
              Recorded with the acting user in the audit log.
            </p>
          </div>
        ) : null}
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={save.isPending}
          onClick={close}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            save.isPending ||
            blocked ||
            (Boolean(baseline) &&
              JSON.stringify(values) === JSON.stringify(defaults))
          }
        >
          {save.isPending
            ? "Saving…"
            : baseline
              ? "Save control"
              : "Create control"}
        </Button>
      </div>
    </form>
  );
}
