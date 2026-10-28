"use client";

import { AlertTriangle, History, Search } from "lucide-react";
import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import {
  AdvancedSystemLogSearch,
  SystemConfigurationHistory,
} from "@/features/notification-system-logs";
import { cn } from "@/lib/utils";

type SystemLogView = "search" | "configuration-history";

export default function SystemLogsPage() {
  const [activeView, setActiveView] = useState<SystemLogView>("search");
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("system-logs.search") ?? false;
  const canExport =
    session.data?.permissions.includes("system-logs.export") ?? false;
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="System Logs"
        description="Search operational logs and review traceable system configuration changes."
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading system log access"
          className="space-y-4"
          role="status"
        >
          {/* Tab bar skeleton */}
          <div className="flex gap-1">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
          {/* Content skeleton */}
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : session.isError ? (
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-danger"
            strokeWidth={1.8}
          />
          <p className="text-sm text-muted">
            Unable to verify your system-log access. Please refresh the page.
          </p>
        </div>
      ) : !allowed ? (
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            strokeWidth={1.8}
          />
          <p className="text-sm text-muted">
            System log search is available to administrators and Security
            Officers only.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 shadow-xs"
              role="tablist"
              aria-label="System log functions"
            >
              <ViewTab
                active={activeView === "search"}
                icon={Search}
                label="Log Search"
                onClick={() => setActiveView("search")}
              />
              {isAdmin ? (
                <ViewTab
                  active={activeView === "configuration-history"}
                  icon={History}
                  label="Configuration Change History"
                  onClick={() => setActiveView("configuration-history")}
                />
              ) : null}
            </div>
          </div>
          <div aria-live="polite" role="tabpanel">
            {activeView === "configuration-history" && isAdmin ? (
              <SystemConfigurationHistory />
            ) : (
              <AdvancedSystemLogSearch canExport={canExport} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Search;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "bg-brand text-brand-contrast font-semibold shadow-xs"
          : "text-muted hover:bg-neutral-soft hover:text-foreground",
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4",
          active ? "text-brand-contrast" : "text-muted",
        )}
        strokeWidth={2}
      />
      {label}
    </button>
  );
}
