"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/data-display/pagination";
import { useIncidentPhaseHistory } from "../hooks/use-incident-phase-history";
const label = (phase: string) => phase.toLowerCase().replaceAll("_", " ");
export function IncidentPhaseHistory({ incidentId }: { incidentId: string }) {
  const [page, setPage] = useState(1);
  const history = useIncidentPhaseHistory(incidentId, page);
  return (
    <details className="border-border rounded-lg border p-3">
      <summary className="focus-visible:outline-brand cursor-pointer text-sm font-medium focus-visible:outline-2">
        Phase transition history
      </summary>
      <div className="mt-3 space-y-3">
        {history.isPending ? (
          <div role="status" aria-busy="true">
            <span className="sr-only">Loading phase history</span>
            <Skeleton className="h-20" />
          </div>
        ) : history.isError ? (
          <Alert role="alert">
            Unable to load phase history.{" "}
            <Button variant="secondary" onClick={() => void history.refetch()}>
              Try again
            </Button>
          </Alert>
        ) : history.data?.items.length ? (
          <>
            <ol className="space-y-3">
              {history.data.items.map((item) => (
                <li
                  key={item.id}
                  className="border-border rounded-lg border p-3 text-sm [overflow-wrap:anywhere]"
                >
                  <p className="font-medium capitalize">
                    {label(item.before.status)} → {label(item.after.status)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{item.after.note}</p>
                  {item.after.skipReason ? (
                    <p className="text-muted mt-1">
                      Emergency exception: {item.after.skipReason}.
                      {!item.after.currentPhaseCompleted
                        ? " Earlier work was not marked complete."
                        : " Recovery verification was still required."}
                    </p>
                  ) : null}
                  {item.after.skippedPhases.length ? (
                    <p className="text-muted mt-1">
                      Skipped phases:{" "}
                      {item.after.skippedPhases.map(label).join(", ")}
                    </p>
                  ) : null}
                  <p className="text-muted mt-2 text-xs">
                    {item.actor?.name ?? "Unavailable user"} ·{" "}
                    <time dateTime={item.occurredAt}>
                      {new Date(item.occurredAt).toLocaleString()}
                    </time>
                  </p>
                </li>
              ))}
            </ol>
            <Pagination
              page={page}
              pageCount={history.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <Alert>No explicit phase transitions recorded yet.</Alert>
        )}
      </div>
    </details>
  );
}
