"use client";
import { ClipboardCheck, Ellipsis, Search, Plus, Pencil, Paperclip, History } from "lucide-react";
import { ControlEvidenceDialog } from "./control-evidence-dialog";
import { ControlEditor } from "./control-editor";
import { useRef, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/authentication-account";
import {
  useControlAssessments,
  useCreateControlAssessment,
} from "../hooks/use-control-assessments";
import type { ControlAssessmentItem } from "../schemas/control-assessment-schema";

const labels = {
  effective: "Effective",
  partially_effective: "Partially effective",
  ineffective: "Ineffective",
} as const;
const tones = {
  effective: "success",
  partially_effective: "warning",
  ineffective: "danger",
} as const;
export function ControlAssessmentManager() {
  const session = useSessionUser();
  const [editor, setEditor] = useState<{ controlId?: string }>();
  const [evidenceControl, setEvidenceControl] = useState<string>();
  const canCreate =
    session.data?.permissions.includes("controls.create") ?? false;
  const canEdit =
    session.data?.permissions.includes("controls.update") ?? false;
  const enabled =
    session.data?.permissions.includes("compliance.assess-controls") ?? false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string>();
  const query = useControlAssessments(
    { page, limit: 10, ...(q ? { q } : {}) },
    enabled,
  );
  const mutation = useCreateControlAssessment();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ControlAssessmentItem>();
  const [method, setMethod] = useState("");
  const [result, setResult] = useState<keyof typeof labels>("effective");
  const [effectiveness, setEffectiveness] = useState("100");
  const [notes, setNotes] = useState("");
  const [assessmentTab, setAssessmentTab] = useState<"assess" | "history">(
    "assess",
  );
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 5;
  const [error, setError] = useState<string>();
  const open = (item: ControlAssessmentItem) => {
    setSelected(item);
    setMethod("");
    setResult("effective");
    setEffectiveness(item.assessments[0]?.effectiveness?.toString() ?? "100");
    setNotes("");
    setAssessmentTab("assess");
    setHistoryPage(1);
    setError(undefined);
    ref.current?.showModal();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const score = Number(effectiveness);
    if (
      method.trim().length < 3 ||
      notes.trim().length < 10 ||
      score < 0 ||
      score > 100
    ) {
      setError(
        "Complete the test method, effectiveness (0–100), and assessment notes.",
      );
      return;
    }
    try {
      await mutation.mutateAsync({
        controlId: selected.id,
        body: {
          testMethod: method.trim(),
          result,
          effectiveness: score,
          notes: notes.trim(),
        },
      });
      ref.current?.close();
      toast.success(
        "Control effectiveness assessed",
        `${selected.controlCode} was recorded as ${labels[result].toLowerCase()}.`,
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save the assessment.",
      );
    }
  };
  const columns: readonly DataTableColumn<ControlAssessmentItem>[] = [
    {
      key: "control",
      header: "Control",
      cell: (item) => (
        <span className="block min-w-56">
          <strong className="block">{item.name}</strong>
          <span className="text-muted text-xs">{item.controlCode}</span>
        </span>
      ),
    },
    {
      key: "implementation",
      header: "Implementation",
      cell: (item) => (
        <span className="text-sm">
          <strong className="block font-medium">
            {item.applicability.replaceAll("_", " ")}
          </strong>
          <span className="text-muted">
            {item.implementationStatus.replaceAll("_", " ")}
          </span>
        </span>
      ),
    },
    {
      key: "evidence",
      header: "Evidence",
      cell: (item) => `${item.evidence.length} eligible`,
    },
    {
      key: "latest",
      header: "Latest result",
      cell: (item) => {
        const latest = item.assessments[0];
        return latest?.result ? (
          <StatusBadge tone={tones[latest.result]}>
            {labels[latest.result]}
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Not assessed</StatusBadge>
        );
      },
    },
    {
      key: "owner",
      header: "Control owner",
      cell: (item) =>
        item.owner?.fullName ?? <span className="text-muted">Unassigned</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (item) => (
        <DropdownMenu
          className="w-fit"
          label={
            <span className="grid size-8 place-items-center">
              <span className="sr-only">Actions for {item.controlCode}</span>
              <Ellipsis aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
          }
        >
          {item.canManageEvidence ? (
            <button
              type="button"
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={() => setEvidenceControl(item.id)}
            >
              <Paperclip className="size-4" aria-hidden="true" />
              Evidence
            </button>
          ) : null}
          <button
            type="button"
            className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!item.evidence.length}
            onClick={() => open(item)}
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Assess
          </button>
          {canEdit ? (
            <button
              type="button"
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={() => setEditor({ controlId: item.id })}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </button>
          ) : null}
        </DropdownMenu>
      ),
    },
  ];
  if (session.isPending)
    return (
      <div
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
        aria-label="Checking access"
      />
    );
  if (!enabled)
    return (
      <Alert>
        You do not have access to Control Effectiveness. Assigned Control Owners
        can view their controls.
      </Alert>
    );
  return (
    <>
      <ProductPageHeader
        title="Control Effectiveness"
        description="Assess whether implemented controls operate effectively using testing results and supporting evidence."
        additionalActions={
          canCreate ? (
            <Button onClick={() => setEditor({})}>
              <Plus className="size-4" aria-hidden="true" />
              Create control
            </Button>
          ) : undefined
        }
      />
      <ProductPanel title="Security controls">
        <div className="space-y-4 p-5">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setQ(search.trim() || undefined);
            }}
          >
            <Input
              aria-label="Search controls"
              placeholder="Control code or name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Search
            </Button>
          </form>
          {query.isError ? (
            <Alert>
              Unable to load controls.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </Alert>
          ) : query.isPending ? (
            <div className="bg-neutral-soft h-64 animate-pulse rounded-xl" />
          ) : query.data.items.length ? (
            <DataTable
              columns={columns}
              rows={query.data.items}
              getRowKey={(item) => item.id}
            />
          ) : (
            <EmptyState
              title="No controls available"
              description={
                canCreate
                  ? "Create a reusable control to get started. Evidence and Risk links are added separately."
                  : "Control Owners see only controls currently assigned to them."
              }
            />
          )}
          {query.data ? (
            <Pagination
              page={page}
              pageCount={query.data.pagination.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </ProductPanel>
      {evidenceControl ? (
        <ControlEvidenceDialog
          controlId={evidenceControl}
          onClose={() => setEvidenceControl(undefined)}
        />
      ) : null}
      {editor ? (
        <ControlEditor {...editor} onClose={() => setEditor(undefined)} />
      ) : null}
      <Dialog
        title={selected ? `Assess ${selected.controlCode}` : "Assess control"}
        dialogRef={ref}
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      >
        <div
          className="border-border bg-surface mb-4 inline-flex w-full gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
          role="tablist"
          aria-label="Control assessment views"
        >
          <button
            id="control-assess-tab"
            type="button"
            role="tab"
            aria-selected={assessmentTab === "assess"}
            aria-controls="control-assessment-panel"
            tabIndex={assessmentTab === "assess" ? 0 : -1}
            className={`min-h-10 flex-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none ${assessmentTab === "assess" ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
            onClick={() => setAssessmentTab("assess")}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                setAssessmentTab("assess");
                event.currentTarget.parentElement
                  ?.querySelector<HTMLButtonElement>("#control-history-tab")
                  ?.focus();
              }
            }}
          >
            Assess control
          </button>
          <button
            id="control-history-tab"
            type="button"
            role="tab"
            aria-selected={assessmentTab === "history"}
            aria-controls="control-history-panel"
            tabIndex={assessmentTab === "history" ? 0 : -1}
            className={`min-h-10 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none ${assessmentTab === "history" ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
            onClick={() => setAssessmentTab("history")}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                setAssessmentTab("history");
                event.currentTarget.parentElement
                  ?.querySelector<HTMLButtonElement>("#control-assess-tab")
                  ?.focus();
              }
            }}
          >
            <History className="size-4" aria-hidden="true" />
            History ({selected?.assessments.length ?? 0})
          </button>
        </div>
        {assessmentTab === "history" ? (
          <section id="control-history-panel" role="tabpanel" aria-labelledby="control-history-tab" className="space-y-3">
            <p className="text-muted text-sm">
              Previous assessment results are read-only. Saving a new assessment
              creates a new record and does not overwrite this history.
            </p>
            {selected?.assessments.length ? (
              selected.assessments
                .slice(
                  (historyPage - 1) * historyPageSize,
                  historyPage * historyPageSize,
                )
                .map((assessment) => {
                const assessmentLabel = assessment.result
                  ? labels[assessment.result]
                  : "Not assessed";
                const assessmentTone = assessment.result
                  ? tones[assessment.result]
                  : "neutral";
                return (
                <article
                  key={assessment.id}
                  className="border-border rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {assessmentLabel}
                      </p>
                      <p className="text-muted text-sm">
                        {new Intl.DateTimeFormat("en-GB", {
                          timeZone: "Asia/Bangkok",
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(assessment.assessedAt))} (UTC+7)
                      </p>
                    </div>
                    <StatusBadge tone={assessmentTone}>
                      {assessment.effectiveness ?? "—"}% effective
                    </StatusBadge>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Assessed by</dt>
                      <dd>{assessment.assessor.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Test method</dt>
                      <dd className="whitespace-pre-wrap">{assessment.testMethod}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{assessment.notes}</p>
                </article>
                );
                })
            ) : (
              <div className="border-border rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium">No assessment history</p>
                <p className="text-muted mt-1 text-sm">
                  The first saved assessment will appear here.
                </p>
              </div>
            )}
            {selected?.assessments.length ? (
              <Pagination
                page={historyPage}
                pageCount={Math.ceil(
                  selected.assessments.length / historyPageSize,
                )}
                onPageChange={setHistoryPage}
              />
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => ref.current?.close()}
              >
                Close
              </Button>
            </div>
          </section>
        ) : (
        <form id="control-assessment-panel" className="space-y-4" onSubmit={submit}>
          {error ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {error}
            </Alert>
          ) : null}
          <section className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
            <div>
              <p className="text-muted text-xs uppercase">Applicability</p>
              <p className="mt-1">
                {selected?.applicability.replaceAll("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase">Implementation</p>
              <p className="mt-1">
                {selected?.implementationStatus.replaceAll("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase">Evidence</p>
              <p className="mt-1">
                {selected?.evidence.map((item) => item.name).join(", ")}
              </p>
            </div>
          </section>
          <div>
            <Label htmlFor="testMethod">Test method</Label>
            <Textarea
              id="testMethod"
              className="mt-1.5"
              rows={3}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="testResult">Testing result</Label>
              <Select
                id="testResult"
                className="mt-1.5"
                value={result}
                onChange={(event) =>
                  setResult(event.target.value as keyof typeof labels)
                }
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="effectiveness">Effectiveness (%)</Label>
              <Input
                id="effectiveness"
                className="mt-1.5"
                type="number"
                min={0}
                max={100}
                value={effectiveness}
                onChange={(event) => setEffectiveness(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="controlNotes">Assessment notes</Label>
            <Textarea
              id="controlNotes"
              className="mt-1.5"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => ref.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save assessment"}
            </Button>
          </div>
        </form>
        )}
      </Dialog>
    </>
  );
}
