"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRiskTreatmentPlan, getRiskTreatmentPlanOptions } from "../api/create-risk-treatment-plan";
export function useRiskTreatmentPlanOptions(enabled: boolean) { return useQuery({ queryKey: ["risk-treatment-plan-options"], queryFn: ({ signal }) => getRiskTreatmentPlanOptions(signal), enabled, staleTime: 60_000 }); }
export function useCreateRiskTreatmentPlan() { const client = useQueryClient(); return useMutation({ mutationFn: createRiskTreatmentPlan, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["risk-register"] }), client.invalidateQueries({ queryKey: ["treatment-plans"] })]); } }); }
