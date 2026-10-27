"use client";
import { useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetContextHistory } from "../hooks/use-asset-context-history";
import type { AssetContextSnapshot } from "../schemas/asset-context-history-schema";

function Snapshot({ value }: { value: AssetContextSnapshot | null }) {
  if (!value)
    return <p className="text-muted text-sm">Snapshot unavailable.</p>;
  return (
    <dl className="bg-neutral-soft space-y-3 rounded-lg p-3 text-sm wrap-anywhere">
      <div>
        <dt className="text-muted text-xs font-medium uppercase">
          Business service
        </dt>
        <dd>{value.businessService?.name ?? "Unassigned"}</dd>
      </div>
      <div>
        <dt className="text-muted text-xs font-medium uppercase">
          Dependencies
        </dt>
        <dd>
          {value.dependencies.length ? (
            <ul className="space-y-1">
              {value.dependencies.map((item) => (
                <li key={item.id}>
                  {item.assetCode} — {item.name}
                </li>
              ))}
            </ul>
          ) : (
            "None linked"
          )}
        </dd>
      </div>
      <div>
        <dt className="text-muted text-xs font-medium uppercase">
          Event sources
        </dt>
        <dd>
          {value.eventSources.length ? (
            <ul className="space-y-1">
              {value.eventSources.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          ) : (
            "None linked"
          )}
        </dd>
      </div>
    </dl>
  );
}

export function AssetContextHistory({ assetId }: { assetId: string }) {
  const [page, setPage] = useState(1);
  const history = useAssetContextHistory(assetId, page);
  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">
        Read-only context history for this asset. Changes made before history
        tracking was introduced are not available.
      </p>
      {history.isPending ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Loading context history</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : history.isError ? (
        <Alert>
          Unable to load context history.{" "}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void history.refetch()}
          >
            Retry
          </Button>
        </Alert>
      ) : history.data ? (
        <>
          {!history.data.items.length ? (
            <p className="border-border rounded-lg border border-dashed p-6 text-center text-sm">
              No context history recorded.
            </p>
          ) : (
            history.data.items.map((entry) => (
              <article
                key={entry.id}
                className="border-border rounded-lg border p-3"
              >
                <h3 className="font-medium">Asset context updated</h3>
                <p className="text-muted text-xs">
                  {entry.actor?.fullName ?? "Unknown actor"} ·{" "}
                  <time dateTime={entry.occurredAt}>
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.occurredAt))}
                  </time>
                </p>
                <details className="mt-2">
                  <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
                    View changes
                  </summary>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <section aria-label="Previous context" className="min-w-0">
                      <h4 className="mb-1 text-sm font-medium">Before</h4>
                      <Snapshot value={entry.before} />
                    </section>
                    <section aria-label="New context" className="min-w-0">
                      <h4 className="mb-1 text-sm font-medium">After</h4>
                      <Snapshot value={entry.after} />
                    </section>
                  </div>
                </details>
              </article>
            ))
          )}
          <Pagination
            page={page}
            pageCount={history.data.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
