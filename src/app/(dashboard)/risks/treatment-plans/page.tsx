import { Suspense } from "react";
import { TreatmentPlansShell } from "@/features/risk-assessment";

export default function TreatmentPlansPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted py-10 text-center">
          Loading treatment plans&hellip;
        </p>
      }
    >
      <TreatmentPlansShell />
    </Suspense>
  );
}
