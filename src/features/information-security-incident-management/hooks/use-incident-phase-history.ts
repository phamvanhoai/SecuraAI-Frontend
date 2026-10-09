"use client";
import { useQuery } from "@tanstack/react-query";
import { listIncidentPhaseHistory } from "../api/incident-phase-history";
export function useIncidentPhaseHistory(id: string, page: number) {
  return useQuery({
    queryKey: ["incidents", "phase-history", id, page],
    queryFn: ({ signal }) => listIncidentPhaseHistory(id, page, signal),
    retry: false,
  });
}
