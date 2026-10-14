import type { RiskRegisterDetail } from "../schemas/risk-register-schema";

type HistoryEntry = RiskRegisterDetail["contextHistory"][number];

function readSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : null,
    description:
      typeof record.description === "string" ? record.description : null,
    relationIds: Array.isArray(record.vulnerabilityIds)
      ? record.vulnerabilityIds.filter(
          (id): id is string => typeof id === "string",
        )
      : Array.isArray(record.controlIds)
        ? record.controlIds.filter((id): id is string => typeof id === "string")
        : [],
  };
}

function Snapshot({
  value,
  emptyLabel,
  relationLabel,
  relationNames,
}: {
  value: unknown;
  emptyLabel: string;
  relationLabel: string;
  relationNames: ReadonlyMap<string, string>;
}) {
  const snapshot = readSnapshot(value);
  if (!snapshot) {
    return (
      <p className="text-muted rounded-lg border border-dashed p-3 text-sm">
        {emptyLabel}
      </p>
    );
  }

  const related = snapshot.relationIds.map(
    (id) => relationNames.get(id) ?? "Previously linked record",
  );
  return (
    <dl className="bg-neutral-soft space-y-2 rounded-lg p-3 text-sm">
      <div>
        <dt className="text-muted text-xs font-medium uppercase">Name</dt>
        <dd className="font-medium">{snapshot.name ?? "Not recorded"}</dd>
      </div>
      <div>
        <dt className="text-muted text-xs font-medium uppercase">Description</dt>
        <dd className="whitespace-pre-wrap">
          {snapshot.description ?? "Not recorded"}
        </dd>
      </div>
      <div>
        <dt className="text-muted text-xs font-medium uppercase">
          {relationLabel}
        </dt>
        <dd>{related.length ? related.join(", ") : "None linked"}</dd>
      </div>
    </dl>
  );
}

export function RiskContextHistoryList({
  entries,
  risk,
}: {
  entries: HistoryEntry[];
  risk: RiskRegisterDetail;
}) {
  const vulnerabilityNames = new Map(
    risk.vulnerabilities.map((item) => [item.id, item.name]),
  );
  const controlNames = new Map(
    risk.controls.map((item) => [item.id, `${item.code} — ${item.name}`]),
  );

  if (!entries.length) {
    return (
      <p className="border-border rounded-lg border border-dashed p-6 text-center text-sm">
        No context history recorded.
      </p>
    );
  }

  return entries.map((entry) => {
    const isThreat = entry.type === "threat";
    const relationNames = isThreat ? vulnerabilityNames : controlNames;
    const relationLabel = isThreat
      ? "Related vulnerabilities"
      : "Related controls";
    return (
      <article key={entry.id} className="border-border rounded-lg border p-3">
        <p className="font-medium">
          {isThreat ? "Threat" : "Vulnerability"} {entry.event}
        </p>
        <p className="text-muted text-xs">
          {entry.actor?.fullName ?? "Unknown actor"} ·{" "}
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(entry.occurredAt))}
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium">
            View changes
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <section aria-label="Previous value">
              <h4 className="mb-1 text-sm font-medium">Before</h4>
              <Snapshot
                value={entry.before}
                emptyLabel="No previous value — this record was newly created."
                relationLabel={relationLabel}
                relationNames={relationNames}
              />
            </section>
            <section aria-label="New value">
              <h4 className="mb-1 text-sm font-medium">After</h4>
              <Snapshot
                value={entry.after}
                emptyLabel="No new value recorded."
                relationLabel={relationLabel}
                relationNames={relationNames}
              />
            </section>
          </div>
        </details>
      </article>
    );
  });
}
