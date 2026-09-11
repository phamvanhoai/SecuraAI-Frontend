"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import { PolicyDraftsManager, PolicyPublicationManager } from "@/features/policies";

export default function Page() {
  const session = useSessionUser();
  const canCreateDrafts = session.data?.permissions.includes("policies.create") ?? false;
  const canPublish = session.data?.permissions.includes("policies.publish") ?? false;

  if (session.isPending) {
    return <div aria-label="Loading policy management" className="bg-neutral-soft h-56 animate-pulse rounded-xl" />;
  }

  if (canCreateDrafts) return <PolicyDraftsManager />;
  if (canPublish) return <PolicyPublicationManager />;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        description="This function is restricted to accounts with policy management permission."
        showSampleNotice={false}
        title="Information security policies"
      />
      <EmptyState
        description="The current account does not have permission to create or publish policies."
        title="You do not have permission to manage policies"
      />
    </div>
  );
}
