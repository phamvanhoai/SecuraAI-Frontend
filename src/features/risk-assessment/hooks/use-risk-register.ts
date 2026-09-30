"use client";
import { useQuery } from "@tanstack/react-query";
import { getRiskRecord, listRiskRegister } from "../api/get-risk-register";
import type { RiskRegisterQuery } from "../schemas/risk-register-schema";

export function useRiskRegister(query: RiskRegisterQuery, enabled = true) {
  return useQuery({
    queryKey: ["risk-register", query],
    queryFn: ({ signal }) => listRiskRegister(query, signal),
    enabled,
  });
}
export function useRiskRecord(id: string | null) {
  return useQuery({
    queryKey: ["risk-register", "detail", id],
    queryFn: ({ signal }) => getRiskRecord(id ?? "", signal),
    enabled: id !== null,
  });
}
