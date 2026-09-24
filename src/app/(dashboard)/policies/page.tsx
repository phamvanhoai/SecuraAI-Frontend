"use client";
import { History } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/authentication-account";
import {
  EmployeePolicyAcknowledgementManager,
  PolicyDraftsManager,
  PolicyDepartmentAssignmentManager,
  PolicyControlMappingManager,
  PolicyPublicationManager,
  PolicyVersionHistoryManager,
  UpdatePolicyVersionManager,
} from "@/features/policy-compliance-control";

type View =
  "default" | "new-version" | "assign-departments" | "map-controls" | "history";

export default function Page() {
  const session = useSessionUser();
  const [view, setView] = useState<View>("default");
  const permissions = session.data?.permissions ?? [];
  const canCreateDrafts = permissions.includes("policies.create");
  const canPublish = permissions.includes("policies.publish");
  const canUpdate = permissions.includes("policies.update");
  const canAssignDepartments = permissions.includes(
    "policies.assign-department",
  );
  const canMapControls = permissions.includes("compliance.map-controls");
  const canAcknowledge = permissions.includes("policies.acknowledge");

  if (session.isPending)
    return (
      <div
        aria-label="Loading policy management"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  if (view === "history")
    return <PolicyVersionHistoryManager onBack={() => setView("default")} />;

  let workspace: ReactNode;
  let historyActionIntegrated = false;
  if (view === "new-version" && canUpdate)
    workspace = (
      <UpdatePolicyVersionManager
        {...(canCreateDrafts ? { onBack: () => setView("default") } : {})}
      />
    );
  else if (view === "assign-departments" && canAssignDepartments)
    workspace = (
      <PolicyDepartmentAssignmentManager
        {...(canCreateDrafts ? { onBack: () => setView("default") } : {})}
      />
    );
  else if (view === "map-controls" && canMapControls)
    workspace = (
      <PolicyControlMappingManager onBack={() => setView("default")} />
    );
  else if (canCreateDrafts)
    workspace = (
      <PolicyDraftsManager
        {...(canAssignDepartments
          ? { onAssignDepartments: () => setView("assign-departments") }
          : {})}
        {...(canUpdate
          ? { onCreateNewVersion: () => setView("new-version") }
          : {})}
        {...(canMapControls
          ? { onMapControls: () => setView("map-controls") }
          : {})}
      />
    );
  else if (canAcknowledge) {
    historyActionIntegrated = true;
    workspace = (
      <EmployeePolicyAcknowledgementManager
        onViewHistory={() => setView("history")}
      />
    );
  } else if (canAssignDepartments)
    workspace = <PolicyDepartmentAssignmentManager />;
  else if (canMapControls) workspace = <PolicyControlMappingManager />;
  else if (canUpdate) workspace = <UpdatePolicyVersionManager />;
  else if (canPublish) workspace = <PolicyPublicationManager />;
  else return <PolicyVersionHistoryManager />;

  return (
    <div className="space-y-3">
      {!historyActionIntegrated ? (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setView("history")}>
            <History aria-hidden="true" className="size-4" />
            View version history
          </Button>
        </div>
      ) : null}
      {workspace}
    </div>
  );
}
