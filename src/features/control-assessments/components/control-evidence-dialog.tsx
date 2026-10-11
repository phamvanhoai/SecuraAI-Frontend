"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import {
  useControlEvidence,
  useEvidenceMutations,
} from "../hooks/use-control-evidence";
import {
  addControlEvidenceSchema,
  linkControlEvidenceSchema,
  evidenceDocumentUrlSchema,
  type ControlEvidenceItem,
} from "../schemas/control-evidence-schema";

const displayDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not set";
function bangkokInputNow() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
function inputTime(value: string) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : "";
}

function EvidenceInfo({ item }: { item: ControlEvidenceItem }) {
  const url = evidenceDocumentUrlSchema.safeParse(item.documentUrl);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="break-words">{item.name}</strong>
        <StatusBadge tone={item.usable ? "success" : "warning"}>
          {item.usable
            ? "Eligible for assessment"
            : "Not eligible for new assessment"}
        </StatusBadge>
      </div>
      <p className="text-muted">
        Source: {item.source} · Status: {item.status}
      </p>
      <p className="break-words whitespace-pre-wrap">
        {item.description ?? "No description recorded."}
      </p>
      <p className="text-muted">
        Collected: {displayDate(item.collectedAt)} · Valid until:{" "}
        {item.validUntil ? displayDate(item.validUntil) : "No expiry recorded"}{" "}
        (UTC+7)
      </p>
      {item.validFrom ? (
        <p className="text-muted">
          Valid from: {displayDate(item.validFrom)} (UTC+7)
        </p>
      ) : null}
      <p className="text-muted">
        Evidence owner: {item.owner?.fullName ?? "Unassigned"} ·{" "}
        {item.reviewedAt
          ? `Reviewed: ${displayDate(item.reviewedAt)} by ${item.reviewedBy?.fullName ?? "Not recorded"}`
          : "Not reviewed"}
      </p>
      {item.linkedAt ? (
        <p className="text-muted">
          Linked: {displayDate(item.linkedAt)} by{" "}
          {item.linkedBy?.fullName ?? "Not recorded"}
        </p>
      ) : null}
      {url.success ? (
        <a
          href={url.data}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="text-brand focus-visible:outline-brand inline-flex min-h-11 items-center gap-2 underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Open supporting document (new tab)
        </a>
      ) : (
        <p className="text-muted">
          No supported HTTPS reference recorded. Existing metadata remains
          available.
        </p>
      )}
    </div>
  );
}

export function ControlEvidenceDialog({
  controlId,
  onClose,
}: {
  controlId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"linked" | "add" | "link">("linked");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<ControlEvidenceItem>();
  const [reason, setReason] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [collectedAt, setCollectedAt] = useState(bangkokInputNow);
  const [initialCollectedAt, setInitialCollectedAt] = useState(collectedAt);
  const [validUntil, setValidUntil] = useState("");
  const [values, setValues] = useState({
    name: "",
    source: "",
    description: "",
    documentUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [blocked, setBlocked] = useState(false);
  const query = useControlEvidence(controlId, {
    page,
    limit: 10,
    q,
    view: mode === "link" ? "available" : "linked",
  });
  const mutations = useEvidenceMutations();
  const toast = useToast();
  const saving = mutations.add.isPending || mutations.link.isPending;
  const dirty =
    mode === "add"
      ? Object.values(values).some(Boolean) ||
        Boolean(validUntil) ||
        collectedAt !== initialCollectedAt
      : mode === "link" && (Boolean(chosen) || Boolean(reason));
  const close = () => {
    if (
      !busy.current &&
      (!dirty || window.confirm("Discard unsaved evidence changes?"))
    )
      onClose();
  };
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const changeMode = (next: typeof mode) => {
    if (
      busy.current ||
      (dirty && !window.confirm("Discard unsaved evidence changes?"))
    )
      return;
    setMode(next);
    setPage(1);
    setQ("");
    setSearch("");
    setChosen(undefined);
    setReason("");
    setError(undefined);
    setErrors({});
    setValues({ name: "", source: "", description: "", documentUrl: "" });
    setValidUntil("");
    const nextCollection = bangkokInputNow();
    setCollectedAt(nextCollection);
    setInitialCollectedAt(nextCollection);
    setRequestId(crypto.randomUUID());
  };
  const clearFieldError = (key: string) => {
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError((current) =>
      current === "Check the highlighted fields before saving."
        ? undefined
        : current,
    );
  };
  const set = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    clearFieldError(key);
  };
  const invalid = (next: Record<string, string>) => {
    setErrors(next);
    setError("Check the highlighted fields before saving.");
    const first = Object.keys(next)[0];
    if (first)
      form.current?.querySelector<HTMLElement>(`#evidence-${first}`)?.focus();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      busy.current ||
      blocked ||
      query.isError ||
      !query.data ||
      (mode === "add" ? !query.data.canAdd : !query.data.canLink)
    )
      return;
    setError(undefined);
    setErrors({});
    try {
      if (mode === "add") {
        let collected: string;
        let until: string | null;
        try {
          collected = inputTime(collectedAt);
        } catch {
          invalid({ collectedAt: "Enter a valid collection date and time" });
          return;
        }
        try {
          until = validUntil ? inputTime(validUntil) : null;
        } catch {
          invalid({ validUntil: "Enter a valid end date and time" });
          return;
        }
        const parsed = addControlEvidenceSchema.safeParse({
          ...values,
          requestId,
          collectedAt: collected,
          validUntil: until,
        });
        if (!parsed.success) {
          invalid(
            Object.fromEntries(
              parsed.error.issues.map((issue) => [
                String(issue.path[0]),
                issue.message,
              ]),
            ),
          );
          return;
        }
        if (new Date(collected).getTime() > Date.now()) {
          invalid({ collectedAt: "Collection time cannot be in the future" });
          return;
        }
        if (until && new Date(until).getTime() <= Date.now()) {
          invalid({ validUntil: "Validity must end after the current time" });
          return;
        }
        busy.current = true;
        const result = await mutations.add.mutateAsync({
          controlId,
          body: parsed.data,
        });
        toast.success(
          result.created ? "Evidence added" : "Evidence already saved",
          "The reference is linked. Review the document before assessing; effectiveness and Risk ratings are unchanged.",
        );
      } else if (mode === "link") {
        const parsed = linkControlEvidenceSchema.safeParse({
          evidenceId: chosen?.id,
          reason,
        });
        if (!parsed.success) {
          invalid(
            Object.fromEntries(
              parsed.error.issues.map((issue) => [
                String(issue.path[0]),
                issue.message,
              ]),
            ),
          );
          return;
        }
        busy.current = true;
        const result = await mutations.link.mutateAsync({
          controlId,
          body: parsed.data,
        });
        toast.success(
          result.linked ? "Evidence linked" : "Evidence already linked",
          "The existing record is reused. No assessment or Risk rating was changed.",
        );
      } else return;
      setMode("linked");
      setPage(1);
      setQ("");
      setSearch("");
      setChosen(undefined);
      setReason("");
      setValues({ name: "", source: "", description: "", documentUrl: "" });
      setValidUntil("");
      setRequestId(crypto.randomUUID());
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to confirm the save. Close, reopen and check linked evidence before trying again.",
      );
      if (
        !(cause instanceof ApiError) ||
        [0, 401, 403, 404, 500, 503].includes(cause.status)
      )
        setBlocked(true);
      if (cause instanceof ApiError && cause.status === 409) {
        setChosen(undefined);
        setBlocked(true);
      }
    } finally {
      busy.current = false;
    }
  };
  const errorText = (key: string) =>
    errors[key] ? (
      <p id={`evidence-${key}-error`} className="text-danger mt-1 text-sm">
        {errors[key]}
      </p>
    ) : null;
  const attributes = (key: string) => ({
    id: `evidence-${key}`,
    "aria-invalid": Boolean(errors[key]),
    ...(errors[key] ? { "aria-describedby": `evidence-${key}-error` } : {}),
  });
  return (
    <Dialog
      title="Control Evidence"
      dialogRef={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
        {query.data ? (
          <p className="font-medium break-words">
            {query.data.control.controlCode} — {query.data.control.name}
          </p>
        ) : null}
        <p className="text-muted text-sm">
          Register or reuse supporting evidence before assessing effectiveness.
          Documents remain in the external repository; SecuraAI does not upload,
          verify or grant access to them. Do not paste passwords or access
          tokens into URLs.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Evidence actions"
        >
          <Button
            variant="secondary"
            aria-pressed={mode === "linked"}
            className={
              mode === "linked" ? "border-brand text-brand" : undefined
            }
            disabled={saving || blocked}
            onClick={() => changeMode("linked")}
          >
            Linked evidence
          </Button>
          {query.data?.canAdd ? (
            <Button
              variant="secondary"
              aria-pressed={mode === "add"}
              className={mode === "add" ? "border-brand text-brand" : undefined}
              disabled={saving || blocked}
              onClick={() => changeMode("add")}
            >
              Add evidence
            </Button>
          ) : null}
          {query.data?.canLink ? (
            <Button
              variant="secondary"
              aria-pressed={mode === "link"}
              className={
                mode === "link" ? "border-brand text-brand" : undefined
              }
              disabled={saving || blocked}
              onClick={() => changeMode("link")}
            >
              Link existing evidence
            </Button>
          ) : null}
        </div>
        {error ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {error}
            {blocked
              ? " Close and reopen to refresh access and saved records."
              : ""}
          </Alert>
        ) : null}
        {query.isError ? (
          <Alert>
            Unable to load evidence or access has changed.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </Alert>
        ) : query.isPending ? (
          <p role="status" className="text-muted py-6">
            Loading evidence…
          </p>
        ) : mode === "add" ? (
          <form ref={form} onSubmit={submit} className="space-y-4" noValidate>
            <fieldset
              disabled={saving || blocked || !query.data.canAdd}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="evidence-name">Evidence name *</Label>
                  <Input
                    {...attributes("name")}
                    className="mt-1.5"
                    value={values.name}
                    maxLength={255}
                    onChange={(event) => set("name", event.target.value)}
                  />
                  {errorText("name")}
                </div>
                <div>
                  <Label htmlFor="evidence-source">Source *</Label>
                  <Input
                    {...attributes("source")}
                    className="mt-1.5"
                    value={values.source}
                    maxLength={255}
                    onChange={(event) => set("source", event.target.value)}
                  />
                  {errorText("source")}
                  <p className="text-muted mt-1 text-xs">
                    For example: MFA configuration review or authentication test
                    report.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="evidence-description">
                  Results, scope and supporting context *
                </Label>
                <Textarea
                  {...attributes("description")}
                  className="mt-1.5"
                  rows={4}
                  value={values.description}
                  maxLength={5000}
                  onChange={(event) => set("description", event.target.value)}
                />
                {errorText("description")}
              </div>
              <div>
                <Label htmlFor="evidence-documentUrl">
                  Supporting document URL (HTTPS) *
                </Label>
                <Input
                  {...attributes("documentUrl")}
                  className="mt-1.5"
                  type="url"
                  value={values.documentUrl}
                  maxLength={2048}
                  onChange={(event) => set("documentUrl", event.target.value)}
                />
                {errorText("documentUrl")}
                <p className="text-muted mt-1 text-xs">
                  Use a stable document link. The reviewer must have permission
                  in that repository; the document need not be public.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="evidence-collectedAt">
                    Collected at (UTC+7) *
                  </Label>
                  <Input
                    {...attributes("collectedAt")}
                    className="mt-1.5"
                    type="datetime-local"
                    value={collectedAt}
                    onChange={(event) => {
                      setCollectedAt(event.target.value);
                      clearFieldError("collectedAt");
                    }}
                  />
                  {errorText("collectedAt")}
                </div>
                <div>
                  <Label htmlFor="evidence-validUntil">
                    Valid until (UTC+7, optional)
                  </Label>
                  <Input
                    {...attributes("validUntil")}
                    className="mt-1.5"
                    type="datetime-local"
                    value={validUntil}
                    onChange={(event) => {
                      setValidUntil(event.target.value);
                      clearFieldError("validUntil");
                    }}
                  />
                  {errorText("validUntil")}
                </div>
              </div>
              <p className="text-muted text-sm">
                You are recorded as the Evidence owner and linking user. This
                creates an Active reference, not a review or an effectiveness
                result.
              </p>
            </fieldset>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving || blocked || !query.data.canAdd}
              >
                {saving ? "Saving…" : "Add and link evidence"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setQ(search.trim());
                setPage(1);
                setChosen(undefined);
              }}
            >
              <div className="min-w-0 flex-1">
                <Label htmlFor="evidence-search">Search evidence</Label>
                <Input
                  id="evidence-search"
                  className="mt-1.5"
                  value={search}
                  maxLength={100}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="sm:self-end"
                disabled={saving || blocked}
              >
                <Search className="size-4" aria-hidden="true" />
                Search
              </Button>
            </form>
            <p className="text-muted text-xs">
              {query.data.pagination.total}{" "}
              {mode === "link" ? "accessible, eligible" : "linked"} records · Up
              to 10 per page.
            </p>
            {mode === "link" ? (
              <p className="text-muted text-sm">
                Choose a relevant item you own or can access through an assigned
                Control. Linking shares its metadata and document reference with
                this Control’s authorized users; external document permissions
                are unchanged.
              </p>
            ) : null}
            {query.data.items.length ? (
              <ul className="space-y-3">
                {query.data.items.map((item) => (
                  <li
                    key={item.id}
                    className="border-border rounded-lg border p-4"
                  >
                    {mode === "link" ? (
                      <label className="mb-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
                        <Input
                          type="radio"
                          className="size-4 min-h-0 p-0"
                          name="evidence-choice"
                          value={item.id}
                          checked={chosen?.id === item.id}
                          disabled={saving || blocked || !item.usable}
                          onChange={() => {
                            setChosen(item);
                            clearFieldError("evidenceId");
                          }}
                        />
                        Select {item.name}
                      </label>
                    ) : null}
                    <EvidenceInfo item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={
                  mode === "link"
                    ? "No eligible evidence available"
                    : "No evidence linked"
                }
                description={
                  mode === "link"
                    ? "Only accessible Active evidence within its validity period and not already linked is listed. Change the search or add a new reference."
                    : "Add a new supporting document reference or link an existing evidence record."
                }
              />
            )}
            <Pagination
              page={page}
              pageCount={query.data.pagination.totalPages}
              onPageChange={(next) => {
                if (!saving && !blocked) {
                  setPage(next);
                  setChosen(undefined);
                }
              }}
            />
            {mode === "link" ? (
              <form
                ref={form}
                onSubmit={submit}
                noValidate
                className="space-y-4"
              >
                <fieldset
                  disabled={saving || blocked || !query.data.canLink}
                  className="space-y-4"
                >
                  <p id="evidence-evidenceId" tabIndex={-1} className="text-sm">
                    {chosen
                      ? `Selected: ${chosen.name}`
                      : "Select an evidence item above."}
                  </p>
                  {errorText("evidenceId")}
                  <div>
                    <Label htmlFor="evidence-reason">
                      Why does this evidence support the Control? *
                    </Label>
                    <Textarea
                      {...attributes("reason")}
                      className="mt-1.5"
                      rows={3}
                      value={reason}
                      maxLength={2000}
                      onChange={(event) => {
                        setReason(event.target.value);
                        clearFieldError("reason");
                      }}
                    />
                    {errorText("reason")}
                  </div>
                </fieldset>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving || blocked || !query.data.canLink}
                  >
                    {saving ? "Saving…" : "Link selected evidence"}
                  </Button>
                </div>
              </form>
            ) : null}
          </>
        )}
        <div className="flex justify-end">
          <Button variant="secondary" disabled={saving} onClick={close}>
            {mode === "linked" ? "Close" : "Cancel"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
