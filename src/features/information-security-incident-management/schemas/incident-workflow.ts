export const incidentPhases = [
  "open",
  "triage",
  "containment",
  "eradication",
  "recovery",
  "lessons_learned",
  "closed",
] as const;
export function canRecordIncidentAction(
  status: string | undefined,
  phase: string,
): boolean {
  const current = incidentPhases.findIndex((value) => value === status);
  const target = incidentPhases.findIndex((value) => value === phase);
  return status !== "closed" && target >= 0 && current >= target;
}
