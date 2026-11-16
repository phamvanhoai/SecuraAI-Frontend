"use client";

import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import { ApiKeysTab } from "@/features/integrations";

export default function SettingsPage() {
  const session = useSessionUser();
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;

  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="System Settings"
        description="Manage production-backed system integration settings."
        showSampleNotice={false}
      />

      {session.isPending ? (
        <div
          aria-busy="true"
          aria-label="Verifying administrator access"
          className="border-border bg-surface space-y-3 rounded-xl border p-6"
        >
          <div className="bg-surface-strong h-5 w-48 animate-pulse rounded" />
          <div className="bg-surface-strong h-4 w-80 animate-pulse rounded" />
          <div className="bg-surface-strong h-32 w-full animate-pulse rounded-lg" />
        </div>
      ) : session.isError ? (
        <Alert>Unable to verify your system settings access.</Alert>
      ) : !isAdmin ? (
        <Alert>
          System integration settings and API key management are restricted to
          administrators only.
        </Alert>
      ) : (
        <ProductPanel
          title="Integration API Keys"
          description="Manage credentials used by approved external services, pipelines, and log forwarders to authenticate with SecuraAI."
        >
          <div className="p-5">
            <ApiKeysTab />
          </div>
        </ProductPanel>
      )}
    </div>
  );
}
