import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainingWorkspace } from "@/features/training";

export default function Page() {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-56 w-full" aria-label="Loading training" />
      }
    >
      <TrainingWorkspace />
    </Suspense>
  );
}
