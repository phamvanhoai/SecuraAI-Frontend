"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { useSessionUser } from "@/features/auth";
import { TrainingCoursesManager } from "./training-courses-manager";
import { TrainingCompletionManager } from "./training-completion-manager";
import { MyAssessmentsManager } from "./my-assessments-manager";
export function TrainingWorkspace() {
  const session = useSessionUser();
  const [showAssessments, setShowAssessments] = useState(false);
  if (session.isPending)
    return <Skeleton className="h-56 w-full" aria-label="Loading training" />;
  if (session.isError)
    return (
      <Alert>
        Unable to load training access.{" "}
        <Button variant="secondary" onClick={() => void session.refetch()}>
          Retry
        </Button>
      </Alert>
    );
  const permissions = session.data?.permissions ?? [];
  const canAssess = permissions.includes("training-assessments.take");
  const assessmentAction = canAssess
    ? { onAssessments: () => setShowAssessments(true) }
    : {};
  if (showAssessments && canAssess)
    return <MyAssessmentsManager onBack={() => setShowAssessments(false)} />;
  if (permissions.includes("training-courses.read"))
    return <TrainingCoursesManager {...assessmentAction} />;
  if (permissions.includes("training-completion.read"))
    return <TrainingCompletionManager {...assessmentAction} />;
  if (permissions.includes("training-assessments.take"))
    return <MyAssessmentsManager />;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Security awareness training"
        description="Training functions are available according to your permissions."
        showSampleNotice={false}
      />
      <EmptyState
        title="You do not have permission to access training"
        description="Contact your administrator to request the appropriate training access."
      />
    </div>
  );
}
