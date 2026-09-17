"use client";
import { ClipboardCheck, History, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { MetricStrip, ProductPageHeader, ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import { useAssessmentHistory, useControlAssessments, useCreateControlAssessment } from "../hooks/use-control-assessments";
import type { ControlAssessmentItem } from "../schemas/control-assessment-schema";

const labels = { compliant: "Compliant", partially_compliant: "Partially compliant", non_compliant: "Non-compliant", not_assessed: "Not assessed" } as const;
const tones = { compliant: "success", partially_compliant: "warning", non_compliant: "danger", not_assessed: "neutral" } as const;
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)) : "—";

export function ControlAssessmentManager() {
  const session = useSessionUser();
  const allowed = session.data?.permissions.includes("compliance.assess-controls") ?? false;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string>();
  const [frameworkId, setFrameworkId] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [reviewState, setReviewState] = useState<string>();
  const query = useControlAssessments({ page, limit: 20, ...(q ? { q } : {}), ...(frameworkId ? { frameworkId } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(reviewState ? { reviewState } : {}) }, allowed);
  const [selected, setSelected] = useState<ControlAssessmentItem>();
  const history = useAssessmentHistory(selected?.id);
  const mutation = useCreateControlAssessment();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<keyof typeof labels>("compliant");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [nextReview, setNextReview] = useState("");
  const [error, setError] = useState<string>();
  const open = (item: ControlAssessmentItem) => {
    setSelected(item); setStatus(item.latestAssessment?.complianceStatus ?? "compliant");
    setScore(item.latestAssessment?.score?.toString() ?? ""); setNotes(""); setNextReview(""); setError(undefined);
    dialogRef.current?.showModal();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return; setError(undefined);
    const numericScore = score === "" ? null : Number(score);
    if (numericScore !== null && (numericScore < 0 || numericScore > 100)) { setError("Score must be between 0 and 100."); return; }
    try {
      await mutation.mutateAsync({ controlId: selected.id, body: { complianceStatus: status, score: numericScore, notes: notes.trim() || null, nextReviewAt: nextReview ? new Date(nextReview).toISOString() : null } });
      dialogRef.current?.close();
      toast.success("Assessment recorded", `${selected.controlCode} now has a new compliance assessment.`);
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Unable to save the assessment."); }
  };
  const columns: readonly DataTableColumn<ControlAssessmentItem>[] = [
    { key: "control", header: "Control", cell: (item) => <span className="block min-w-60"><strong className="block">{item.title}</strong><span className="text-muted text-xs">{item.controlCode}</span></span> },
    { key: "framework", header: "Framework", cell: (item) => <span>{item.framework.code}{item.framework.version ? ` ${item.framework.version}` : ""}</span> },
    { key: "policies", header: "Mapped policies", cell: (item) => item.mappedPolicies.length ? <span className="block max-w-52 text-sm">{item.mappedPolicies.map((policy) => policy.policyCode).join(", ")}{item.mappedPolicyCount > item.mappedPolicies.length ? ` +${item.mappedPolicyCount - item.mappedPolicies.length}` : ""}</span> : <span className="text-muted">No policy coverage</span> },
    { key: "status", header: "Compliance", cell: (item) => item.latestAssessment ? <StatusBadge tone={tones[item.latestAssessment.complianceStatus]}>{labels[item.latestAssessment.complianceStatus]}</StatusBadge> : <StatusBadge tone="neutral">Not assessed</StatusBadge> },
    { key: "score", header: "Score", cell: (item) => item.latestAssessment?.score == null ? "—" : `${item.latestAssessment.score}%` },
    { key: "review", header: "Review", cell: (item) => { const next = item.latestAssessment?.nextReviewAt; const overdue = next ? new Date(next) < new Date() : false; return <span className="block"><span>{formatDate(item.latestAssessment?.assessedAt ?? null)}</span>{next ? <span className={overdue ? "text-danger block text-xs font-medium" : "text-muted block text-xs"}>{overdue ? "Overdue" : "Next"}: {formatDate(next)}</span> : <span className="text-muted block text-xs">No review scheduled</span>}</span>; } },
    { key: "action", header: "Action", cell: (item) => <Button className="min-h-10" variant="secondary" onClick={() => open(item)}><ClipboardCheck className="size-4" aria-hidden="true" />Assess</Button> },
  ];
  if (session.isPending) return <div aria-label="Checking control assessment permission" className="bg-neutral-soft h-56 animate-pulse rounded-xl" />;
  if (!allowed) return <Alert><strong className="block">You do not have permission to assess controls</strong><span>Contact an administrator to request compliance.assess-controls.</span></Alert>;
  return <>
    <ProductPageHeader title="Assess control compliance" description="Record and review the compliance level of controls in your security frameworks." showSampleNotice={false} />
    <MetricStrip metrics={[
      { label: "Compliant", value: String(query.data?.summary.compliant ?? 0), detail: "Latest assessment status", tone: "brand" },
      { label: "Partially compliant", value: String(query.data?.summary.partiallyCompliant ?? 0), detail: "Latest assessment status", tone: "warning" },
      { label: "Non-compliant", value: String(query.data?.summary.nonCompliant ?? 0), detail: "Latest assessment status", tone: "warning" },
      { label: "Not assessed / overdue", value: `${query.data?.summary.notAssessed ?? 0} / ${query.data?.summary.overdue ?? 0}`, detail: "Requires attention", tone: "neutral" },
    ]} />
    <ProductPanel title="Framework controls" description={`${query.data?.pagination.total ?? 0} controls available for assessment.`}>
      <div className="space-y-4 p-5">
        <form className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_13rem_13rem_13rem_auto]" onSubmit={(event) => { event.preventDefault(); setPage(1); setQ(search.trim() || undefined); }}>
          <div className="relative"><Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true"/><Input className="pl-9" aria-label="Search controls" placeholder="Search by control code or title" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <Select aria-label="Filter by framework" value={frameworkId ?? ""} onChange={(event) => { setFrameworkId(event.target.value || undefined); setPage(1); }}><option value="">All frameworks</option>{query.data?.frameworks.map((item) => <option key={item.id} value={item.id}>{item.code}{item.version ? ` ${item.version}` : ""}</option>)}</Select>
          <Select aria-label="Filter by compliance status" value={statusFilter ?? ""} onChange={(event) => { setStatusFilter(event.target.value || undefined); setPage(1); }}><option value="">All statuses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Select aria-label="Filter by review date" value={reviewState ?? ""} onChange={(event) => { setReviewState(event.target.value || undefined); setPage(1); }}><option value="">All review dates</option><option value="overdue">Overdue</option><option value="due_soon">Due within 30 days</option><option value="scheduled">Scheduled later</option><option value="unscheduled">Not scheduled</option></Select>
          <Button type="submit"><Search className="size-4" aria-hidden="true"/>Search</Button>
        </form>
        {query.isError ? <Alert><strong>Unable to load controls.</strong><span className="ml-1">{query.error.message}</span></Alert> : query.isPending ? <div className="bg-neutral-soft h-64 animate-pulse rounded-xl" /> : query.data.items.length === 0 ? <EmptyState title="No controls found" description="Try another search or framework filter." /> : <DataTable columns={columns} rows={query.data.items} getRowKey={(item) => item.id} />}
        {query.data?.resultsTruncated ? <Alert>Results are limited to the first 5,000 controls. Narrow the filters for an exact result.</Alert> : null}
        {query.data ? <Pagination page={page} pageCount={query.data.pagination.totalPages} onPageChange={setPage} /> : null}
      </div>
    </ProductPanel>
    <Dialog className="w-[min(44rem,calc(100%-2rem))]" dialogRef={dialogRef} title={selected ? `Assess ${selected.controlCode}` : "Assess control"}>
      <form className="space-y-4" onSubmit={submit}>
        <p className="text-muted text-sm">{selected?.title}</p>{error ? <Alert>{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="assessment-status">Compliance status</Label><Select id="assessment-status" className="mt-1.5" value={status} onChange={(event) => setStatus(event.target.value as keyof typeof labels)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div><Label htmlFor="assessment-score">Score (0–100, optional)</Label><Input id="assessment-score" className="mt-1.5" type="number" min="0" max="100" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} /><p className="text-muted mt-1 text-xs">Optional professional assessment score. It does not determine the compliance status.</p></div></div>
        <div><Label htmlFor="next-review">Next review</Label><Input id="next-review" className="mt-1.5" type="datetime-local" value={nextReview} onChange={(event) => setNextReview(event.target.value)} /></div>
        <div><Label htmlFor="assessment-notes">Assessment notes</Label><Textarea id="assessment-notes" className="mt-1.5 min-h-24" maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        <section aria-labelledby="history-title" className="border-border border-t pt-4">
          <h3 id="history-title" className="flex items-center gap-2 font-semibold"><History className="size-4" aria-hidden="true"/>Recent history</h3>
          {history.isPending ? <p className="text-muted mt-2 text-sm">Loading history…</p> : history.data?.items.length ? <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1 text-sm">{history.data.items.map((item) => <li className="border-border rounded-lg border p-3" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge tone={tones[item.complianceStatus]}>{labels[item.complianceStatus]}</StatusBadge><span className="text-muted">Assessed {formatDate(item.assessedAt)}</span></div>
            <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2"><div><dt className="text-muted inline">Score: </dt><dd className="inline">{item.score === null ? "—" : `${item.score}%`}</dd></div><div><dt className="text-muted inline">Evidence: </dt><dd className="inline">{item.evidenceCount}</dd></div><div><dt className="text-muted inline">Assessor: </dt><dd className="inline">{item.assessor?.name ?? "Unknown"}</dd></div><div><dt className="text-muted inline">Next review: </dt><dd className="inline">{formatDate(item.nextReviewAt)}</dd></div></dl>
            <div className="mt-2"><span className="text-muted">Notes: </span><p className="mt-1 whitespace-pre-wrap break-words">{item.notes || "No notes provided."}</p></div>
          </li>)}</ul> : <p className="text-muted mt-2 text-sm">No previous assessments.</p>}
        </section>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => dialogRef.current?.close()}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save assessment"}</Button></div>
      </form>
    </Dialog>
  </>;
}
