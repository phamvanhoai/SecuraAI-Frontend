import { Suspense } from "react";
import { RiskAssessmentsShell } from "@/features/risk-assessment";

export default function RisksPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted py-10 text-center">
          Loading risk assessments…
        </p>
      }
    >
      <RiskAssessmentsShell />
    </Suspense>
  );
}
