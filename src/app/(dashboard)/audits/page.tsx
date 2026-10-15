"use client";

import { Database, KeyRound, List, UserRound } from "lucide-react";
import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import {
  AuditLogsManager,
  EventDataGovernancePolicy,
  IntegrationApiKeyList,
  UserActivityAuditLogManager,
} from "@/features/audit-security-reporting";
import { cn } from "@/lib/utils";

type AuditView = "all" | "user-activity" | "data-governance" | "api-keys";

export default function AuditsPage() {
  const [activeView, setActiveView] = useState<AuditView>("all");
  const session = useSessionUser();
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Audit Logs"
        description="Monitor user actions, configuration changes, and system access activities for compliance and accountability."
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading audit access"
          className="bg-neutral-soft h-72 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to verify your audit-log access.</Alert>
      ) : !isAdmin ? (
        <Alert>This audit log is available to administrators only.</Alert>
      ) : (
        <div className="space-y-5">
          <div
            aria-label="Audit log views"
            className="border-border bg-surface flex w-full gap-1 overflow-x-auto rounded-xl border p-1 sm:w-fit"
            role="tablist"
          >
            <AuditTab
              active={activeView === "all"}
              icon={List}
              label="All Audit Records"
              onClick={() => setActiveView("all")}
            />
            <AuditTab
              active={activeView === "user-activity"}
              icon={UserRound}
              label="User Activity"
              onClick={() => setActiveView("user-activity")}
            />
            <AuditTab
              active={activeView === "data-governance"}
              icon={Database}
              label="Data Governance"
              onClick={() => setActiveView("data-governance")}
            />
            <AuditTab
              active={activeView === "api-keys"}
              icon={KeyRound}
              label="Integration API Keys"
              onClick={() => setActiveView("api-keys")}
            />
          </div>
          <div role="tabpanel">
            {activeView === "all" ? <AuditLogsManager /> : null}
            {activeView === "user-activity" ? (
              <UserActivityAuditLogManager />
            ) : null}
            {activeView === "data-governance" ? (
              <EventDataGovernancePolicy />
            ) : null}
            {activeView === "api-keys" ? <IntegrationApiKeyList /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof List;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "focus-visible:outline-brand flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "bg-brand text-white shadow-sm"
          : "text-muted hover:bg-neutral-soft hover:text-foreground",
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}
