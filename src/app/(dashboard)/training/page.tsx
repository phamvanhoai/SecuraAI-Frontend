"use client";

import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { useSessionUser } from "@/features/auth";
import {
  MyAssessmentsManager,
  TrainingCompletionManager,
  TrainingCoursesManager,
} from "@/features/training";

export default function Page() {
  const [view, setView] = useState<"courses" | "completion">("courses");
  const session = useSessionUser();
  const canManageCourses =
    session.data?.permissions.includes("training-courses.read") ?? false;
  const canTakeAssessments =
    session.data?.permissions.includes("training-assessments.take") ?? false;
  const canTrackCompletion =
    session.data?.permissions.includes("training-completion.read") ?? false;

  if (session.isPending) {
    return (
      <div
        aria-label="Loading training"
        className="bg-neutral-soft h-56 animate-pulse rounded-xl"
      />
    );
  }
  if (canManageCourses && view === "courses")
    return (
      <TrainingCoursesManager
        {...(canTrackCompletion
          ? { onTrackCompletion: () => setView("completion") }
          : {})}
      />
    );
  if (canTrackCompletion)
    return (
      <TrainingCompletionManager
        {...(canManageCourses
          ? { onViewCourses: () => setView("courses") }
          : {})}
      />
    );
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
