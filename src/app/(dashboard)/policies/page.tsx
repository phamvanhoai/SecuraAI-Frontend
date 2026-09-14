"use client";

import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import {
  PolicyDraftsManager,
  PolicyDepartmentAssignmentManager,
  PolicyPublicationManager,
  UpdatePolicyVersionManager,
} from "@/features/policies";

export default function Page() {
  const session = useSessionUser();
  const [view, setView] = useState<
    "default" | "new-version" | "assign-departments"
  >("default");
  const canCreateDrafts =
    session.data?.permissions.includes("policies.create") ?? false;
  const canPublish =
    session.data?.permissions.includes("policies.publish") ?? false;
  const canUpdate =
    session.data?.permissions.includes("policies.update") ?? false;
  const canAssignDepartments =
    session.data?.permissions.includes("policies.assign-department") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Loading policy management"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }

  if (view === "new-version" && canUpdate) {
    return (
      <UpdatePolicyVersionManager
        {...(canCreateDrafts ? { onBack: () => setView("default") } : {})}
      />
    );
  }
  if (view === "assign-departments" && canAssignDepartments) {
    return (
      <PolicyDepartmentAssignmentManager
        {...(canCreateDrafts ? { onBack: () => setView("default") } : {})}
      />
    );
  }
  if (canCreateDrafts) {
    return (
      <PolicyDraftsManager
        {...(canAssignDepartments
          ? { onAssignDepartments: () => setView("assign-departments") }
          : {})}
        {...(canUpdate
          ? { onCreateNewVersion: () => setView("new-version") }
          : {})}
      />
    );
  }
  if (canAssignDepartments) return <PolicyDepartmentAssignmentManager />;
  if (canUpdate) return <UpdatePolicyVersionManager />;
  if (canPublish) return <PolicyPublicationManager />;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        description="This function is restricted to accounts with policy management permission."
        showSampleNotice={false}
        title="Information security policies"
      />
      <EmptyState
        description="The current account does not have permission to create, update, publish, or assign policies."
        title="You do not have permission to manage policies"
      />
    </div>
  );
}
