"use client";

import {
  Bug,
  Eye,
  Gauge,
  GaugeCircle,
  ClipboardList,
  Search,
  ShieldAlert,
  Target,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useRiskRegister } from "../hooks/use-risk-register";
import {
  riskRegisterQuerySchema,
  type RiskRegisterItem,
  type RiskRegisterQuery,
} from "../schemas/risk-register-schema";
import { RiskAssessmentDetailDialog } from "./risk-assessment-detail-dialog";
import { CreateRiskAssessmentDialog } from "./create-risk-assessment-dialog";
import { IdentifyThreatDialog } from "./identify-threat-dialog";
import { IdentifyVulnerabilityDialog } from "./identify-vulnerability-dialog";
import { AssessInherentRiskDialog } from "./assess-inherent-risk-dialog";
import { AssessResidualRiskDialog } from "./assess-residual-risk-dialog";
import { DefineTargetRiskDialog } from "./define-target-risk-dialog";
import { CreateRiskTreatmentPlanDialog } from "./create-risk-treatment-plan-dialog";

const labels = {
  open: "Open",
  under_treatment: "Under treatment",
  accepted: "Accepted",
  closed: "Closed",
  archived: "Archived",
} as const;
const ratingTone = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
} as const;
const statusTone = {
  open: "warning",
  under_treatment: "info",
  accepted: "neutral",
  closed: "success",
  archived: "neutral",
} as const;
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not scheduled";

function fromParams(params: URLSearchParams): RiskRegisterQuery {
  const parsed = riskRegisterQuerySchema.safeParse(
    Object.fromEntries(params.entries()),
  );
  return parsed.success ? parsed.data : riskRegisterQuerySchema.parse({});
}

export function RiskAssessmentsShell() {
  const router = useRouter();
  const params = useSearchParams();
  const query = useMemo(() => fromParams(params), [params]);
  const session = useSessionUser();
  const canRead = Boolean(session.data);
  const canCreate = session.data?.permissions.includes("risks.create") ?? false;
  const risks = useRiskRegister(query, canRead);
  const [draft, setDraft] = useState(query.q ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threatRisk, setThreatRisk] = useState<RiskRegisterItem | null>(null);
  const [vulnerabilityRisk, setVulnerabilityRisk] =
    useState<RiskRegisterItem | null>(null);
  const [inherentRisk, setInherentRisk] = useState<RiskRegisterItem | null>(
    null,
  );
  const [residualRisk, setResidualRisk] = useState<RiskRegisterItem | null>(
    null,
  );
  const [targetRisk, setTargetRisk] = useState<RiskRegisterItem | null>(null);
  const [planRisk, setPlanRisk] = useState<RiskRegisterItem | null>(null);
  const navigate = (next: Partial<RiskRegisterQuery>) => {
    const search = new URLSearchParams();
    Object.entries({ ...query, ...next }).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.set(key, String(value));
    });
    router.push(`/risks?${search.toString()}`);
  };
  const columns: readonly DataTableColumn<RiskRegisterItem>[] = [
    {
      key: "risk",
      header: "Risk",
      cell: (item) => (
        <span className="block min-w-56">
          <strong className="block">{item.title}</strong>
          <span className="text-muted text-xs">{item.riskCode}</span>
        </span>
      ),
    },
    {
      key: "rating",
      header: "Inherent rating",
      cell: (item) =>
        item.latestAssessment?.inherentRating ? (
          <StatusBadge tone={ratingTone[item.latestAssessment.inherentRating]}>
            {item.latestAssessment.inherentRating}
          </StatusBadge>
        ) : (
          <span className="text-muted">Not assessed</span>
        ),
    },
    {
      key: "assets",
      header: "Related assets",
      cell: (item) =>
        item.assets.length ? (
          <span className="block max-w-56">
            {item.assets
              .slice(0, 2)
              .map((asset) => asset.name)
              .join(", ")}
            {item.assets.length > 2 ? ` +${item.assets.length - 2}` : ""}
          </span>
        ) : (
          <span className="text-muted">None linked</span>
        ),
    },
    {
      key: "owner",
      header: "Owner",
      cell: (item) =>
        item.owner?.fullName ?? <span className="text-muted">Unassigned</span>,
    },
    {
      key: "review",
      header: "Review date",
      cell: (item) => (
        <span className="tabular-nums">{date(item.reviewDate)}</span>
      ),
    },
    {
      key: "links",
      header: "Linked records",
      cell: (item) => (
        <span className="text-muted text-xs">
          {item.linkedCounts.controls} controls ·{" "}
          {item.linkedCounts.treatmentPlans} plans ·{" "}
          {item.linkedCounts.incidents} incidents
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={statusTone[item.status]}>
          {labels[item.status]}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <span className="flex gap-2">
          {canCreate || item.owner?.id === session.data?.id ? <Button variant="secondary" onClick={() => setPlanRisk(item)} aria-label={`Create treatment plan for ${item.riskCode}`}><ClipboardList className="size-4" aria-hidden="true" />Plan</Button> : null}
          {canCreate ? (
            <Button
              variant="secondary"
              onClick={() => setThreatRisk(item)}
              aria-label={`Identify threat for ${item.riskCode}`}
            >
              <ShieldAlert
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              Threat
            </Button>
          ) : null}
          {item.owner?.id === session.data?.id ? (
            <Button
              variant="secondary"
              onClick={() => setResidualRisk(item)}
              aria-label={`Assess residual risk for ${item.riskCode}`}
            >
              <GaugeCircle
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              Residual
            </Button>
          ) : null}
          {item.owner?.id === session.data?.id ? (
            <Button
              variant="secondary"
              onClick={() => setTargetRisk(item)}
              aria-label={`Define target risk for ${item.riskCode}`}
            >
              <Target className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Target
            </Button>
          ) : null}
          {canCreate ? (
            <Button
              variant="secondary"
              onClick={() => setInherentRisk(item)}
              aria-label={`Assess inherent risk for ${item.riskCode}`}
            >
              <Gauge className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Assess
            </Button>
          ) : null}
          {canCreate ? (
            <Button
              variant="secondary"
              onClick={() => setVulnerabilityRisk(item)}
              aria-label={`Identify vulnerability for ${item.riskCode}`}
            >
              <Bug className="size-4" strokeWidth={1.8} aria-hidden="true" />
              Weakness
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => setSelectedId(item.id)}
            aria-label={`View ${item.riskCode} details`}
          >
            <Eye className="size-4" strokeWidth={1.8} aria-hidden="true" />
            View
          </Button>
        </span>
      ),
    },
  ];
  if (session.isPending) return <TableSkeleton rows={8} columns={7} />;
  if (!canRead)
    return (
      <Alert>
        <strong className="block">
          You do not have access to the risk register
        </strong>
        <span>This view is available to authorized Security Officers.</span>
      </Alert>
    );
  return (
    <>
      <div className="space-y-5">
        <ProductPageHeader
          title="Risk Register"
          description="Review risk ratings, ownership, linked assets, controls, treatment plans, review dates, and incidents."
          additionalActions={canCreate ? <CreateRiskAssessmentDialog /> : null}
        />
        <ProductPanel title="Risk records">
          <form
            className="border-border grid gap-3 border-b p-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              navigate({ page: 1, q: draft.trim() || undefined });
            }}
          >
            <label className="text-sm font-medium">
              Search
              <Input
                className="mt-1"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Risk code, title, owner, or asset"
                maxLength={100}
              />
            </label>
            <label className="text-sm font-medium">
              Status
              <Select
                className="mt-1"
                value={query.status ?? ""}
                onChange={(event) =>
                  navigate({
                    page: 1,
                    status: event.target.value
                      ? (event.target.value as RiskRegisterQuery["status"])
                      : undefined,
                  })
                }
              >
                <option value="">All statuses</option>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-medium">
              Rating
              <Select
                className="mt-1"
                value={query.riskRating ?? ""}
                onChange={(event) =>
                  navigate({
                    page: 1,
                    riskRating: event.target.value
                      ? (event.target.value as RiskRegisterQuery["riskRating"])
                      : undefined,
                  })
                }
              >
                <option value="">All ratings</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit">
                <Search className="size-4" aria-hidden="true" />
                Search
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label="Clear filters"
                onClick={() => {
                  setDraft("");
                  router.push("/risks");
                }}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
          <div className="p-4">
            {risks.isPending ? (
              <TableSkeleton rows={8} columns={7} />
            ) : risks.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                <strong className="block">
                  Unable to load the risk register
                </strong>
                <span>Check the backend connection and try again.</span>
                <Button
                  className="mt-3"
                  variant="secondary"
                  onClick={() => void risks.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            ) : risks.data?.items.length ? (
              <>
                <DataTable
                  columns={columns}
                  rows={risks.data.items}
                  getRowKey={(item) => item.id}
                />
                <div className="mt-4">
                  <Pagination
                    page={risks.data.pagination.page}
                    pageCount={risks.data.pagination.totalPages}
                    onPageChange={(page) => navigate({ page })}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                title="No risks found"
                description="Adjust the filters, or create risk records through an implemented risk workflow."
              />
            )}
          </div>
        </ProductPanel>
      </div>
      <RiskAssessmentDetailDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <IdentifyThreatDialog
        riskId={threatRisk?.id ?? null}
        riskLabel={
          threatRisk ? `${threatRisk.riskCode} — ${threatRisk.title}` : ""
        }
        onClose={() => setThreatRisk(null)}
      />
      <IdentifyVulnerabilityDialog
        riskId={vulnerabilityRisk?.id ?? null}
        riskLabel={
          vulnerabilityRisk
            ? `${vulnerabilityRisk.riskCode} — ${vulnerabilityRisk.title}`
            : ""
        }
        onClose={() => setVulnerabilityRisk(null)}
      />
      <AssessInherentRiskDialog
        riskId={inherentRisk?.id ?? null}
        riskLabel={
          inherentRisk ? `${inherentRisk.riskCode} — ${inherentRisk.title}` : ""
        }
        onClose={() => setInherentRisk(null)}
      />
      <AssessResidualRiskDialog
        riskId={residualRisk?.id ?? null}
        riskLabel={
          residualRisk ? `${residualRisk.riskCode} — ${residualRisk.title}` : ""
        }
        onClose={() => setResidualRisk(null)}
      />
      <DefineTargetRiskDialog
        riskId={targetRisk?.id ?? null}
        riskLabel={
          targetRisk ? `${targetRisk.riskCode} — ${targetRisk.title}` : ""
        }
        onClose={() => setTargetRisk(null)}
      />
      <CreateRiskTreatmentPlanDialog riskId={planRisk?.id ?? null} riskLabel={planRisk ? `${planRisk.riskCode} — ${planRisk.title}` : ""} onClose={() => setPlanRisk(null)} />
    </>
  );
}
