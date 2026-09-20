import { TreatmentPlanDetailShell } from "@/features/risks/components/treatment-plan-detail-shell";

export default async function TreatmentPlanDetailPage({ params }: { params: Promise<{ treatmentPlanId: string }> }) {
  const { treatmentPlanId } = await params;
  return <TreatmentPlanDetailShell treatmentPlanId={treatmentPlanId} />;
}
