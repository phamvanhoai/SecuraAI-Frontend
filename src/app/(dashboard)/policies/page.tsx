"use client";

import { useState, type ReactNode } from "react";
import { useSessionUser } from "@/features/authentication-account";
import {
  EmployeePolicyAcknowledgementManager,
  PolicyControlMappingManager,
  PolicyDepartmentAssignmentManager,
  PolicyDraftsManager,
  PolicyPublicationManager,
  PolicyVersionHistoryManager,
  PublishedPolicyManager,
  UpdatePolicyVersionManager,
} from "@/features/policy-compliance-control";

type View =
  | "default"
  | "new-version"
  | "published"
  | "assign-departments"
  | "map-controls"
  | "history";

export default function Page() {
  const session = useSessionUser();
  const [view, setView] = useState<View>("default");
  const permissions = session.data?.permissions ?? [];
  const canCreateDrafts = permissions.includes("policies.create");
  const canPublish = permissions.includes("policies.publish");
  const canUpdate = permissions.includes("policies.update");
  const canAssignDepartments = permissions.includes("policies.assign-department");
  const canMapControls = permissions.includes("compliance.map-controls");
  const canAcknowledge = permissions.includes("policies.acknowledge");

  if (session.isPending)
    return <div aria-label="Loading policy management" className="bg-neutral-soft h-56 animate-pulse rounded-xl" />;

  const goHome = () => setView("default");
  const goPublished = () => setView("published");
  const goHistory = () => setView("history");
  let workspace: ReactNode;

  if (view === "history")
    workspace = (
      <PolicyVersionHistoryManager
        backLabel={canAcknowledge && !canCreateDrafts ? "Published" : "Drafts"}
        onBack={goHome}
      />
    );
  else if (view === "published" && canUpdate)
    workspace = (
      <PublishedPolicyManager onViewDrafts={goHome} onViewHistory={goHistory} />
    );
  else if (view === "new-version" && canUpdate)
    workspace = <UpdatePolicyVersionManager {...(canCreateDrafts ? { onBack: goHome } : {})} />;
  else if (view === "assign-departments" && canAssignDepartments)
    workspace = <PolicyDepartmentAssignmentManager {...(canCreateDrafts ? { onBack: goHome } : {})} />;
  else if (view === "map-controls" && canMapControls)
    workspace = <PolicyControlMappingManager onBack={goHome} />;
  else if (canCreateDrafts)
    workspace = (
      <PolicyDraftsManager
        {...(canAssignDepartments ? { onAssignDepartments: () => setView("assign-departments") } : {})}
        {...(canUpdate ? { onCreateNewVersion: () => setView("new-version"), onViewPublished: goPublished } : {})}
        {...(canMapControls ? { onMapControls: () => setView("map-controls") } : {})}
        onViewHistory={goHistory}
      />
    );
  else if (canAcknowledge)
    workspace = <EmployeePolicyAcknowledgementManager onViewHistory={goHistory} />;
  else if (canAssignDepartments) workspace = <PolicyDepartmentAssignmentManager />;
  else if (canMapControls) workspace = <PolicyControlMappingManager />;
  else if (canUpdate) workspace = <UpdatePolicyVersionManager />;
  else if (canPublish) workspace = <PolicyPublicationManager />;
  else workspace = <PolicyVersionHistoryManager />;

  return workspace;
}
