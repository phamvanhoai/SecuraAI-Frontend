"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/data-display/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignmentHistory } from "../hooks/use-incidents";

export function AssignmentHistory({ incidentId }: { incidentId: string }) {
  const [page, setPage] = useState(1);
  const history = useAssignmentHistory(incidentId, page);
  if (history.isPending)
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading assignment history…</span>
        <Skeleton className="h-28 motion-reduce:animate-none" />
        <Skeleton className="h-28 motion-reduce:animate-none" />
      </div>
    );
  if (history.isError)
    return (
      <Alert>
        Unable to load assignment history.{" "}
        <Button variant="secondary" onClick={() => void history.refetch()}>
          Try again
        </Button>
      </Alert>
    );
  return (
    <div className="space-y-4">
      {history.data.items.length ? (
        <ol className="space-y-3">
          {history.data.items.map((entry) => (
            <li key={entry.id} className="border-border rounded-lg border p-4">
              <p className="text-sm font-semibold [overflow-wrap:anywhere]">
                {entry.previousHandler?.name ?? "Unassigned"} →{" "}
                {entry.handler?.name ?? "Unknown handler"}
              </p>
              <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">
                {entry.assignedBy?.name ?? "Unknown user"} ·{" "}
                <time dateTime={entry.assignedAt}>
                  {new Date(entry.assignedAt).toLocaleString()}
                </time>
              </p>
              <p className="mt-2 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {entry.note ?? "No assignment note available."}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <Alert>
          No assignment history yet. Assign a handler to record the first entry.
        </Alert>
      )}
      <Pagination
        page={page}
        pageCount={history.data.pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
