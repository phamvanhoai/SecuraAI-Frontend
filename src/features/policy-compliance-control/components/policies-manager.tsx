"use client";

import {
  BookOpen,
  BookOpenCheck,
  Building2,
  FilePenLine,
  Files,
  History,
  Link2,
  Send,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import {
  MetricStrip,
  ProductPageHeader,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import { cn } from "@/lib/utils";
import { usePolicyDrafts } from "../hooks/use-policy-drafts";
import { usePublishablePolicies } from "../hooks/use-policy-publication";
import { usePublishedPoliciesForNewVersion } from "../hooks/use-update-policy-version";
import { useEmployeePolicies } from "../hooks/use-policy-acknowledgements";
import { PolicyDraftsManager } from "./policy-drafts-manager";
import { PolicyPublicationManager } from "./policy-publication-manager";
import { PublishedPolicyManager } from "./published-policy-manager";
import { EmployeePolicyAcknowledgementManager } from "./employee-policy-acknowledgement-manager";
import { PolicyDepartmentAssignmentManager } from "./policy-department-assignment-manager";
import { PolicyControlMappingManager } from "./policy-control-mapping-manager";
import { PolicyVersionHistoryManager } from "./policy-version-history-manager";
import { UpdatePolicyVersionManager } from "./update-policy-version-manager";

type TabId =
  | "drafts"
  | "review"
  | "published"
  | "new-version"
  | "acknowledge"
  | "departments"
  | "controls"
  | "history";

const overviewDraftQuery = {
  page: 1,
  limit: 100,
  sortOrder: "desc" as const,
};
const publishableQuery = {
  page: 1,
  limit: 100,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};
const acknowledgeQuery = { page: 1, limit: 20, status: "all" as const };

export function PoliciesManager() {
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];

  const canCreateDrafts = permissions.includes("policies.create");
  const canPublish = permissions.includes("policies.publish");
  const canUpdate = permissions.includes("policies.update");
  const canAssignDepartments = permissions.includes("policies.assign-department");
  const canMapControls = permissions.includes("compliance.map-controls");
  const canAcknowledge = permissions.includes("policies.acknowledge");
  const canViewHistory = canCreateDrafts || canPublish;

  const firstTab: TabId = canCreateDrafts
    ? "drafts"
    : canPublish
      ? "review"
      : canUpdate
        ? "published"
        : canAcknowledge
          ? "acknowledge"
          : canAssignDepartments
            ? "departments"
            : canMapControls
              ? "controls"
              : "drafts";

  const [activeTab, setActiveTab] = useState<TabId>(firstTab);

  // Metric data — fetched only when the user has the relevant permission
  const draftMetrics = usePolicyDrafts(overviewDraftQuery, canCreateDrafts);
  const publishableMetrics = usePublishablePolicies(publishableQuery);
  const publishedMetrics = usePublishedPoliciesForNewVersion(canUpdate);
  const acknowledgeMetrics = useEmployeePolicies(acknowledgeQuery, canAcknowledge);

  if (session.isPending)
    return (
      <div
        aria-label="Loading policy management"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );

  const hasAnyPermission =
    canCreateDrafts ||
    canPublish ||
    canUpdate ||
    canAcknowledge ||
    canAssignDepartments ||
    canMapControls;

  if (!hasAnyPermission)
    return <Alert>Insufficient permissions to access policies.</Alert>;

  // ── Derived metric values ──────────────────────────────────────────────────
  const draftTotal = draftMetrics.data?.pagination.total ?? 0;
  const draftItems = draftMetrics.data?.items ?? [];
  const draftDescribed = draftItems.filter((d) => d.description).length;
  const draftWithChanges = draftItems.filter(
    (d) => d.version.changeSummary,
  ).length;

  const publishableTotal = publishableMetrics.data?.pagination.total ?? 0;
  const publishableItems = publishableMetrics.data?.items ?? [];
  const publishableDescribed = publishableItems.filter(
    (p) => p.description,
  ).length;
  const publishableOwners = new Set(
    publishableItems.flatMap((p) => (p.ownerUserId ? [p.ownerUserId] : [])),
  ).size;

  const publishedCount = publishedMetrics.data?.length ?? 0;

  const acknowledgeItems = acknowledgeMetrics.data?.items ?? [];
  const acknowledgeTotal = acknowledgeMetrics.data?.pagination.total ?? 0;
  const acknowledgedCount = acknowledgeItems.filter(
    (p) => p.acknowledgedAt,
  ).length;
  const pendingAcknowledge = acknowledgeTotal - acknowledgedCount;

  // ── Tab definitions (permission-gated) ────────────────────────────────────
  type TabDef = {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    count?: number | null;
  };

  const tabs: TabDef[] = [
    ...(canCreateDrafts
      ? [
          {
            id: "drafts" as const,
            label: "Policy drafts",
            icon: (
              <Files
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "drafts" ? "text-brand-contrast" : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
            count: draftMetrics.data ? draftTotal : null,
          },
        ]
      : []),
    ...(canPublish
      ? [
          {
            id: "review" as const,
            label: "Review & publish",
            icon: (
              <Send
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "review" ? "text-brand-contrast" : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
            count: publishableMetrics.data ? publishableTotal : null,
          },
        ]
      : []),
    ...(canUpdate
      ? [
          {
            id: "published" as const,
            label: "Published",
            icon: (
              <BookOpenCheck
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "published"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
            count: publishedMetrics.data ? publishedCount : null,
          },
          {
            id: "new-version" as const,
            label: "New version",
            icon: (
              <FilePenLine
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "new-version"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
          },
        ]
      : []),
    ...(canAcknowledge
      ? [
          {
            id: "acknowledge" as const,
            label: "My policies",
            icon: (
              <BookOpen
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "acknowledge"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
            count: acknowledgeMetrics.data ? acknowledgeTotal : null,
          },
        ]
      : []),
    ...(canAssignDepartments
      ? [
          {
            id: "departments" as const,
            label: "Departments",
            icon: (
              <Building2
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "departments"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
          },
        ]
      : []),
    ...(canMapControls
      ? [
          {
            id: "controls" as const,
            label: "Control mapping",
            icon: (
              <Link2
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "controls"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
          },
        ]
      : []),
    ...(canViewHistory
      ? [
          {
            id: "history" as const,
            label: "Version history",
            icon: (
              <History
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "history"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
            ),
          },
        ]
      : []),
  ];

  // ── Header config per tab ──────────────────────────────────────────────────
  const headerConfig: Record<TabId, { title: string; description: string }> = {
    drafts: {
      title: "Information Security Policy Drafts",
      description:
        "Create and update the policies you own before they are submitted for publication.",
    },
    review: {
      title: "Approve Policy Versions",
      description:
        "Review submitted policy content and approve eligible versions for publication.",
    },
    published: {
      title: "Published Policies",
      description: "View the current official versions of policies you own.",
    },
    "new-version": {
      title: "Create New Policy Version",
      description:
        "Start a new draft version based on an existing published policy.",
    },
    acknowledge: {
      title: "Policies Requiring Acknowledgement",
      description:
        "Read policies applicable to your department and confirm your understanding.",
    },
    departments: {
      title: "Policy Department Assignments",
      description:
        "Assign published policies to the departments they apply to.",
    },
    controls: {
      title: "Policy Control Mapping",
      description:
        "Map information security policies to compliance framework controls.",
    },
    history: {
      title: "Policy Version History",
      description:
        "Browse the full audit trail of policy versions across the lifecycle.",
    },
  };

  const current = headerConfig[activeTab];

  // ── Metrics per tab ────────────────────────────────────────────────────────
  type MetricDef = {
    label: string;
    value: string;
    detail: string;
    tone: "brand" | "neutral" | "warning" | "danger";
    loading?: boolean;
  };

  const metricsMap: Record<TabId, MetricDef[]> = {
    drafts: [
      {
        label: "Total drafts",
        value: draftMetrics.data ? String(draftTotal) : "—",
        detail: "Returned by the backend",
        tone: "brand",
        loading: draftMetrics.isPending,
      },
      {
        label: "On overview",
        value: draftMetrics.data ? String(draftItems.length) : "—",
        detail: `Up to ${overviewDraftQuery.limit} unfiltered`,
        tone: "neutral",
        loading: draftMetrics.isPending,
      },
      {
        label: "With description",
        value: draftMetrics.data ? String(draftDescribed) : "—",
        detail: "On the unfiltered overview",
        tone: "neutral",
        loading: draftMetrics.isPending,
      },
      {
        label: "With change summary",
        value: draftMetrics.data ? String(draftWithChanges) : "—",
        detail: "On the unfiltered overview",
        tone: "neutral",
        loading: draftMetrics.isPending,
      },
    ],
    review: [
      {
        label: "Open workflow",
        value: String(publishableTotal),
        detail: "Review, approval or publication pending",
        tone: "warning",
        loading: publishableMetrics.isPending,
      },
      {
        label: "On overview",
        value: String(publishableItems.length),
        detail: `Up to ${publishableQuery.limit} unfiltered`,
        tone: "neutral",
        loading: publishableMetrics.isPending,
      },
      {
        label: "With description",
        value: String(publishableDescribed),
        detail: "On the unfiltered overview",
        tone: "neutral",
        loading: publishableMetrics.isPending,
      },
      {
        label: "Draft owners",
        value: String(publishableOwners),
        detail: "Unique owners in overview",
        tone: "neutral",
        loading: publishableMetrics.isPending,
      },
    ],
    published: [
      {
        label: "Published policies",
        value: publishedMetrics.data ? String(publishedCount) : "—",
        detail: "Current official versions",
        tone: "brand",
        loading: publishedMetrics.isPending,
      },
      {
        label: "Lifecycle",
        value: "Published",
        detail: "Versioned and auditable",
        tone: "neutral",
        loading: publishedMetrics.isPending,
      },
      {
        label: "Source",
        value: "Live",
        detail: "Fetched from the backend",
        tone: "neutral",
        loading: publishedMetrics.isPending,
      },
      {
        label: "Actions",
        value: "New version",
        detail: "Start a new draft from any",
        tone: "neutral",
        loading: publishedMetrics.isPending,
      },
    ],
    "new-version": [
      {
        label: "Eligible policies",
        value: publishedMetrics.data ? String(publishedCount) : "—",
        detail: "Published — can create new version",
        tone: "brand",
        loading: publishedMetrics.isPending,
      },
      {
        label: "Workflow",
        value: "Submit → Approve → Publish",
        detail: "Standard version lifecycle",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Audit",
        value: "Versioned",
        detail: "Full history preserved",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Action",
        value: "Creates a draft",
        detail: "Draft goes through review",
        tone: "neutral",
        loading: false,
      },
    ],
    acknowledge: [
      {
        label: "Assigned to you",
        value: acknowledgeMetrics.data ? String(acknowledgeTotal) : "—",
        detail: "Policies assigned to your department",
        tone: "brand",
        loading: acknowledgeMetrics.isPending,
      },
      {
        label: "Acknowledged",
        value: acknowledgeMetrics.data ? String(acknowledgedCount) : "—",
        detail: "Confirmed by you",
        tone: "neutral",
        loading: acknowledgeMetrics.isPending,
      },
      {
        label: "Pending reading",
        value: acknowledgeMetrics.data ? String(pendingAcknowledge) : "—",
        detail: "Reading confirmation required",
        tone: pendingAcknowledge > 0 ? "warning" : "neutral",
        loading: acknowledgeMetrics.isPending,
      },
      {
        label: "On this page",
        value: acknowledgeMetrics.data ? String(acknowledgeItems.length) : "—",
        detail: `Up to ${acknowledgeQuery.limit} unfiltered`,
        tone: "neutral",
        loading: acknowledgeMetrics.isPending,
      },
    ],
    departments: [
      {
        label: "Module",
        value: "Departments",
        detail: "Assign published policies to departments",
        tone: "brand",
        loading: false,
      },
      {
        label: "Scope",
        value: "Organization",
        detail: "Applies across business units",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Action",
        value: "Assign",
        detail: "Link policy to department",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Data",
        value: "Live",
        detail: "Fetched from the backend",
        tone: "neutral",
        loading: false,
      },
    ],
    controls: [
      {
        label: "Module",
        value: "Controls",
        detail: "Map policies to compliance controls",
        tone: "brand",
        loading: false,
      },
      {
        label: "Scope",
        value: "Compliance",
        detail: "Frameworks and control objectives",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Action",
        value: "Map",
        detail: "Link policy to control",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Data",
        value: "Live",
        detail: "Fetched from the backend",
        tone: "neutral",
        loading: false,
      },
    ],
    history: [
      {
        label: "Module",
        value: "History",
        detail: "Full audit trail of versions",
        tone: "brand",
        loading: false,
      },
      {
        label: "Scope",
        value: "All versions",
        detail: "Across lifecycle stages",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Access",
        value: "Read-only",
        detail: "Immutable audit record",
        tone: "neutral",
        loading: false,
      },
      {
        label: "Data",
        value: "Live",
        detail: "Fetched from the backend",
        tone: "neutral",
        loading: false,
      },
    ],
  };

  return (
    <>
      {/* Shared page header — title & description switch per tab */}
      <ProductPageHeader
        description={current.description}
        showSampleNotice={false}
        title={current.title}
      />

      {/* Shared metric strip — switches per tab */}
      <MetricStrip
        ariaLabel={`${current.title} metrics`}
        metrics={metricsMap[activeTab]}
      />

      {/* Tab pill switcher — identical pattern to LogSourcesManager */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 shadow-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground",
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                    activeTab === tab.id
                      ? "bg-white/20 text-brand-contrast"
                      : "border-border bg-neutral-soft text-muted border",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — each manager gets hideHeader=true to suppress its own header */}
      {activeTab === "drafts" && canCreateDrafts ? (
        <PolicyDraftsManager
          hideHeader
          {...(canAssignDepartments
            ? { onAssignDepartments: () => setActiveTab("departments") }
            : {})}
          {...(canUpdate
            ? {
                onCreateNewVersion: () => setActiveTab("new-version"),
              }
            : {})}
          {...(canMapControls
            ? { onMapControls: () => setActiveTab("controls") }
            : {})}
          onViewHistory={() => setActiveTab("history")}
        />
      ) : activeTab === "review" && canPublish ? (
        <PolicyPublicationManager
          hideHeader
          onViewHistory={() => setActiveTab("history")}
        />
      ) : activeTab === "published" && canUpdate ? (
        <PublishedPolicyManager
          hideHeader
          onViewDrafts={() => setActiveTab("drafts")}
          onViewHistory={() => setActiveTab("history")}
        />
      ) : activeTab === "new-version" && canUpdate ? (
        <UpdatePolicyVersionManager
          hideHeader
          {...(canCreateDrafts ? { onBack: () => setActiveTab("drafts") } : {})}
        />
      ) : activeTab === "acknowledge" && canAcknowledge ? (
        <EmployeePolicyAcknowledgementManager
          hideHeader
          {...(canViewHistory ? { onViewHistory: () => setActiveTab("history") } : {})}
        />
      ) : activeTab === "departments" && canAssignDepartments ? (
        <PolicyDepartmentAssignmentManager
          hideHeader
          {...(canCreateDrafts
            ? { onBack: () => setActiveTab("drafts") }
            : {})}
        />
      ) : activeTab === "controls" && canMapControls ? (
        <PolicyControlMappingManager
          hideHeader
          onBack={() => setActiveTab("drafts")}
        />
      ) : activeTab === "history" && canViewHistory ? (
        <PolicyVersionHistoryManager
          hideHeader
          backLabel={canPublish && !canCreateDrafts ? "Approvals" : "Drafts"}
          onBack={() => setActiveTab(canCreateDrafts ? "drafts" : "review")}
        />
      ) : (
        <Alert>Insufficient permissions for this section.</Alert>
      )}
    </>
  );
}
