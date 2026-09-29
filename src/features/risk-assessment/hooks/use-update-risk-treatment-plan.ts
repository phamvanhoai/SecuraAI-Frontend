"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRiskTreatmentPlan } from "../api/update-risk-treatment-plan";
export function useUpdateRiskTreatmentPlan(id: string) { const client = useQueryClient(); return useMutation({ mutationFn: (input: Parameters<typeof updateRiskTreatmentPlan>[1]) => updateRiskTreatmentPlan(id, input), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["risk-register"] }), client.invalidateQueries({ queryKey: ["treatment-plans"] })]); } }); }
