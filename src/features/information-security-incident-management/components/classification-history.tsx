"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/data-display/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassificationHistory } from "../hooks/use-incidents";

export function ClassificationHistory({ incidentId }: { incidentId: string }) {
  const [page, setPage] = useState(1);
  const history = useClassificationHistory(incidentId, page);
  if (history.isPending)
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading classification history…</span>
        <Skeleton className="h-28 motion-reduce:animate-none" />
        <Skeleton className="h-28 motion-reduce:animate-none" />
      </div>
    );
  if (history.isError)
    return (
      <Alert>
        Unable to load classification history.{" "}
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
              <p className="text-sm font-semibold capitalize">
                {entry.previousSeverity ?? "Unknown"} →{" "}
                {entry.severity ?? "Unknown"}
              </p>
              <p className="text-muted mt-1 text-sm">
                {entry.classifiedBy?.name ?? "Unknown user"} ·{" "}
                <time dateTime={entry.classifiedAt}>
                  {new Date(entry.classifiedAt).toLocaleString()}
                </time>
              </p>
              <p className="mt-2 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {entry.rationale ?? "No rationale available."}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <Alert>
          No classification history yet. Save a classification with its
          rationale to record the first entry.
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
