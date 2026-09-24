"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSessionUser } from "@/features/authentication-account";
import { useRiskAssessments } from "../hooks/use-risk-assessments";
import type { RiskListItem } from "../schemas/risk-list-schema";
import { CreateTreatmentPlanDialog } from "./create-treatment-plan-dialog";

export function CreateTreatmentPlanEntry({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const session = useSessionUser();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RiskListItem | null>(null);
  const baseQuery = {
    page,
    limit: 50,
    ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
    hasTreatmentPlan: "false" as const,
    sortBy: "updatedAt" as const,
    sortOrder: "desc" as const,
  };
  const drafts = useRiskAssessments({ ...baseQuery, status: "draft" }, open);
  const rejected = useRiskAssessments({ ...baseQuery, status: "rejected" }, open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const close = (): void => {
    setSearch("");
    setSelected(null);
    onClose();
  };
  const isAdmin = session.data?.roles.some(({ code }) => code === "ADMIN") ?? false;
  const risks = [...(drafts.data?.items ?? []), ...(rejected.data?.items ?? [])].filter(
    (risk) => isAdmin || risk.assessedBy?.id === session.data?.id,
  );
  const loading = drafts.isPending || rejected.isPending;
  const failed = drafts.isError || rejected.isError;
  const totalPages = Math.max(
    drafts.data?.pagination.totalPages ?? 0,
    rejected.data?.pagination.totalPages ?? 0,
  );

  return (
    <>
      <Dialog
        title="Select Risk Assessment"
        dialogRef={ref}
        onClose={close}
        className="max-h-[85vh] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      >
        <p className="text-muted text-sm">
          Choose a Draft or Rejected assessment without an active treatment plan.
        </p>
        <div className="relative mt-4">
          <Search className="text-muted pointer-events-none absolute top-3.5 left-3 size-4" aria-hidden="true" />
          <Input
            aria-label="Search eligible risk assessments"
            className="pl-9"
            placeholder="Search by risk code, title, target, or assessor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {failed ? (
          <Alert className="mt-4">Unable to load eligible risk assessments.</Alert>
        ) : null}
        <div className="mt-4 space-y-2">
          {loading ? <p className="text-muted py-6 text-center">Loading assessments...</p> : null}
          {!loading && !failed && risks.length === 0 ? (
            <p className="text-muted py-6 text-center">No eligible risk assessments found.</p>
          ) : null}
          {risks.map((risk) => (
            <button
              type="button"
              key={risk.id}
              className="border-border hover:bg-neutral-soft focus-visible:outline-brand w-full rounded-lg border p-3 text-left focus-visible:outline-2"
              onClick={() => setSelected(risk)}
            >
              <span className="block font-medium">{risk.title}</span>
              <span className="text-muted mt-1 block text-sm">
                {risk.riskCode} · {risk.target.code} — {risk.target.name} · {risk.status}
              </span>
            </button>
          ))}
          {!loading && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span className="text-muted text-sm">Page {page} of {totalPages}</span>
              <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
        </div>
      </Dialog>
      {selected ? (
        <CreateTreatmentPlanDialog
          riskAssessmentId={selected.id}
          riskCode={selected.riskCode}
          expectedRiskUpdatedAt={selected.updatedAt}
          open
          onClose={close}
        />
      ) : null}
    </>
  );
}
