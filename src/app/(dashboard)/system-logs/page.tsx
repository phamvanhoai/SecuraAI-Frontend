"use client";

import { History, Search } from "lucide-react";
import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
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
    session.data?.roles.some((role) =>
      ["ADMIN", "SECURITY_OFFICER"].includes(role.code),
    ) ?? false;
  const canExport =
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
          className="bg-neutral-soft h-72 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to verify your system-log access.</Alert>
      ) : !allowed ? (
        <Alert>
          System log search is available to administrators and Security Officers
          only.
        </Alert>
      ) : (
        <div className="space-y-5">
          <div
            className="border-border bg-surface inline-flex w-full gap-1 rounded-xl border p-1 sm:w-auto"
            role="tablist"
            aria-label="System log functions"
          >
            <ViewTab
              active={activeView === "search"}
              icon={Search}
              label="Log Search"
              onClick={() => setActiveView("search")}
            />
            {canExport ? (
              <ViewTab
                active={activeView === "configuration-history"}
                icon={History}
                label="Configuration Change History"
                onClick={() => setActiveView("configuration-history")}
              />
            ) : null}
          </div>
          <div role="tabpanel">
            {activeView === "configuration-history" && canExport ? (
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
        "focus-visible:outline-brand flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-none",
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
