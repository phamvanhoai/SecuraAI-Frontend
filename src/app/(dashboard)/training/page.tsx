"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import {
  MyAssessmentsManager,
  TrainingCoursesManager,
} from "@/features/training";

export default function Page() {
  const session = useSessionUser();
  const canManageCourses =
    session.data?.permissions.includes("training-courses.read") ?? false;
  const canTakeAssessments =
    session.data?.permissions.includes("training-assessments.take") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Loading training"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }
  if (canManageCourses) return <TrainingCoursesManager />;
  if (canTakeAssessments) return <MyAssessmentsManager />;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        description="This function is restricted to accounts with training permissions."
        showSampleNotice={false}
        title="Security awareness training"
      />
      <EmptyState
        description="The current account cannot manage courses or take assigned assessments."
        title="You do not have permission to access training"
      />
    </div>
  );
}
