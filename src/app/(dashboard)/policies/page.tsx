"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import { PolicyPublicationManager } from "@/features/policies";

export default function Page() {
  const session = useSessionUser();
  const canPublish =
    session.data?.permissions.includes("policies.publish") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Loading policy publication"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }

  if (canPublish) return <PolicyPublicationManager />;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        description="This function is restricted to accounts with policy publication permission."
        showSampleNotice={false}
        title="Publish official policy versions"
      />
      <EmptyState
        description="The current account does not have the policies.publish permission."
        title="You do not have permission to publish policies"
      />
    </div>
  );
}
