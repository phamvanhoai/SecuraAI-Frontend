"use client";

import { History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useAssetHistory } from "../hooks/use-asset-history";
import { assetHistoryActions, type AssetHistoryQuery } from "../schemas/asset-history-schema";

const actionLabels: Record<(typeof assetHistoryActions)[number], string> = {
  created: "Asset created", imported: "Imported from Excel", updated: "Asset updated", classified: "Criticality classified",
  owner_assigned: "Owner assigned", owner_reassigned: "Owner reassigned", owner_unassigned: "Owner unassigned", deleted: "Asset deleted",
};

export function AssetHistoryDialog({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState<AssetHistoryQuery>({ page: 1, limit: 20, sortOrder: "desc" });
  const history = useAssetHistory(assetId, query);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (assetId && !dialog.open) dialog.showModal();
    if (!assetId && dialog.open) dialog.close();
  }, [assetId]);
  const close = (): void => { setQuery({ page: 1, limit: 20, sortOrder: "desc" }); onClose(); };
  return (
    <Dialog dialogRef={dialogRef} title="Asset Change History" onClose={close} className="w-[min(52rem,calc(100%-2rem))]">
      {history.isPending ? <p className="text-muted py-8 text-center">Loading asset change history…</p> : null}
      {history.isError ? <Alert><strong className="block">Unable to load asset change history</strong><span>The asset may not exist or you do not have the assets.history.read permission.</span></Alert> : null}
      {history.data ? <div className="space-y-4">
        <div><p className="text-muted text-sm">{history.data.asset.assetCode}</p><h3 className="font-semibold">{history.data.asset.name}</h3></div>
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Filter history actions" value={query.action ?? ""} onChange={(event) => setQuery((current) => ({ ...current, page: 1, action: event.target.value ? event.target.value as AssetHistoryQuery["action"] : undefined }))}>
            <option value="">All actions</option>{assetHistoryActions.map((action) => <option value={action} key={action}>{actionLabels[action]}</option>)}
          </Select>
          <Select aria-label="History sort order" value={query.sortOrder} onChange={(event) => setQuery((current) => ({ ...current, sortOrder: event.target.value as "asc" | "desc" }))}><option value="desc">Newest first</option><option value="asc">Oldest first</option></Select>
        </div>
        {history.data.items.length === 0 ? <p className="text-muted py-6 text-center">No change history found.</p> : <ol className="divide-border divide-y rounded-lg border">{history.data.items.map((item) => <li className="p-3" key={item.id}><div className="flex gap-3"><History className="text-brand mt-0.5 size-4 shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-medium">{actionLabels[item.action]}</p><p className="text-muted text-xs">{formatDate(item.changedAt)} · {item.changedBy?.fullName ?? "System"}</p>{item.before || item.after ? <details className="mt-2 text-xs"><summary className="cursor-pointer text-muted">View changed data</summary><pre className="bg-neutral-soft mt-2 max-h-36 overflow-auto rounded p-2">{JSON.stringify({ before: item.before, after: item.after }, null, 2)}</pre></details> : null}</div></div></li>)}</ol>}
        {history.data.pagination.totalPages > 1 ? <div className="flex items-center justify-between text-sm"><Button type="button" disabled={query.page === 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button><span>Page {query.page} / {history.data.pagination.totalPages}</span><Button type="button" disabled={query.page === history.data.pagination.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</Button></div> : null}
      </div> : null}
      <div className="mt-6 flex justify-end"><Button type="button" className="bg-neutral-soft text-foreground hover:bg-border" onClick={close}>Close</Button></div>
    </Dialog>
  );
}

function formatDate(value: string): string { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
