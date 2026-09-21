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
import { MyLearningManager } from "./my-learning-manager";
import { MyCertificatesManager } from "./my-certificates-manager";
import { IssuedCertificatesManager } from "./issued-certificates-manager";
import { DepartmentReportManager } from "./department-report-manager";
import { TrainingSectionNavigation } from "./training-section-navigation";
export function TrainingWorkspace() {
  const session = useSessionUser();
  const [showAssessments, setShowAssessments] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "training" | "department-report" | "certificates"
  >("training");
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
  return (
    <TrainingWorkspaceContent
      permissions={permissions}
      showAssessments={showAssessments}
      setShowAssessments={setShowAssessments}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    />
  );
}

function TrainingWorkspaceContent({
  permissions,
  showAssessments,
  setShowAssessments,
  activeSection,
  setActiveSection,
}: {
  permissions: readonly string[];
  showAssessments: boolean;
  setShowAssessments: (value: boolean) => void;
  activeSection: "training" | "department-report" | "certificates";
  setActiveSection: (
    value: "training" | "department-report" | "certificates",
  ) => void;
}) {
  const canAssess = permissions.includes("training-assessments.take");
  const assessmentAction = canAssess
    ? { onAssessments: () => setShowAssessments(true) }
    : {};
  if (showAssessments && canAssess)
    return <MyAssessmentsManager onBack={() => setShowAssessments(false)} />;
  const canReport = permissions.includes("training-department-reports.read");
  const canReadIssued = permissions.includes(
    "training-certificates.read-issued",
  );
  const primaryLabel = permissions.includes("training-courses.read")
    ? "Courses"
    : "Training progress";
  const canViewPrimary =
    permissions.includes("training-courses.read") ||
    permissions.includes("training-completion.read");
  const headerActions = canViewPrimary ? (
    <TrainingSectionNavigation
      active={activeSection}
      onSelect={setActiveSection}
      primaryLabel={primaryLabel}
      showDepartmentReport={canReport}
      showIssuedCertificates={canReadIssued}
    />
  ) : undefined;
  if (activeSection === "department-report" && canReport)
    return <DepartmentReportManager sectionNavigation={headerActions} />;
  if (activeSection === "certificates" && canReadIssued)
    return <IssuedCertificatesManager sectionNavigation={headerActions} />;
  if (permissions.includes("training-courses.read"))
    return (
      <TrainingCoursesManager
        {...assessmentAction}
        headerActions={headerActions}
      />
    );
  if (permissions.includes("training-completion.read"))
    return (
      <TrainingCompletionManager
        {...assessmentAction}
        headerActions={headerActions}
      />
    );
  if (permissions.includes("training-assessments.take"))
    return (
      <MyLearningManager
        canViewCertificates={permissions.includes(
          "training-certificates.read-own",
        )}
      />
    );
  if (permissions.includes("training-certificates.read-own"))
    return <MyCertificatesManager />;
  if (permissions.includes("training-certificates.read-issued"))
    return <IssuedCertificatesManager />;
  if (permissions.includes("training-department-reports.read"))
    return <DepartmentReportManager />;
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
