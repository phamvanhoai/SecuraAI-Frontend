"use client";
import { ClipboardCheck, Search } from "lucide-react";
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
  const enabled = Boolean(session.data);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string>();
  const query = useControlAssessments(
    { page, limit: 20, ...(q ? { q } : {}) },
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
  const [error, setError] = useState<string>();
  const open = (item: ControlAssessmentItem) => {
    setSelected(item);
    setMethod("");
    setResult("effective");
    setEffectiveness(item.assessments[0]?.effectiveness?.toString() ?? "100");
    setNotes("");
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
      cell: (item) => `${item.evidence.length} active`,
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
        <Button
          variant="secondary"
          disabled={!item.evidence.length}
          onClick={() => open(item)}
        >
          <ClipboardCheck className="size-4" aria-hidden="true" />
          Assess
        </Button>
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
  return (
    <>
      <ProductPageHeader
        title="Control Effectiveness"
        description="Assess whether implemented controls operate effectively using testing results and supporting evidence."
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
            <Alert>Unable to load controls.</Alert>
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
              description="Control Owners see assigned controls; Security Officers see all controls."
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
      <Dialog
        title={selected ? `Assess ${selected.controlCode}` : "Assess control"}
        dialogRef={ref}
        className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      >
        <form className="space-y-4" onSubmit={submit}>
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
      </Dialog>
    </>
  );
}
