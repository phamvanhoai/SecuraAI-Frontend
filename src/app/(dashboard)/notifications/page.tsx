"use client";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/auth";
import { ComplianceRemindersManager } from "@/features/notifications";
import { TrainingRemindersManager } from "@/features/training";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    "compliance" | "training"
  >("compliance");
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const canViewCompliance = permissions.some((permission) =>
    [
      "compliance.assess-controls",
      "compliance.evidence.upload",
      "policies.acknowledge",
    ].includes(permission),
  );
  const canViewTraining = permissions.includes("training-assessments.take");
  const activeCategory =
    selectedCategory === "compliance" && canViewCompliance
      ? "compliance"
      : selectedCategory === "training" && canViewTraining
        ? "training"
        : canViewCompliance
          ? "compliance"
          : "training";
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Notifications"
        description="Review deadline reminders assigned to your account."
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading notifications"
          className="bg-neutral-soft h-56 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to check your notification access.</Alert>
      ) : !canViewCompliance && !canViewTraining ? (
        <Alert>No reminder types are available for this account.</Alert>
      ) : (
        <div className="space-y-4">
          {canViewCompliance && canViewTraining ? (
            <div
              aria-label="Notification category"
              className="border-border bg-surface inline-flex rounded-lg border p-1"
              role="tablist"
            >
              {(
                [
                  ["compliance", "Compliance", ShieldCheck],
                  ["training", "Training", GraduationCap],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  aria-selected={activeCategory === value}
                  aria-controls={`${value}-reminders-panel`}
                  className={cn(
                    "focus-visible:outline-brand inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2",
                    activeCategory === value
                      ? "bg-brand text-brand-contrast"
                      : "text-muted hover:bg-neutral-soft hover:text-foreground",
                  )}
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div
            aria-label={`${activeCategory === "compliance" ? "Compliance" : "Training"} reminders`}
            id={`${activeCategory}-reminders-panel`}
            role="tabpanel"
          >
            {activeCategory === "compliance" ? (
              <ComplianceRemindersManager />
            ) : (
              <TrainingRemindersManager showHeader={false} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
