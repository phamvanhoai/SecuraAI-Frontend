"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listComplianceReminders,
  markComplianceReminderRead,
} from "../api/compliance-reminders";
import type { ComplianceReminderFilter } from "../schemas/compliance-reminder-schema";
const key = ["notifications", "compliance-reminders"] as const;
export const useComplianceReminders = (
  page: number,
  status: ComplianceReminderFilter,
  search: string,
  enabled: boolean,
  userId?: string,
) =>
  useQuery({
    queryKey: [...key, userId, page, status, search],
    queryFn: ({ signal }) =>
      listComplianceReminders(page, status, search, signal),
    enabled: enabled && Boolean(userId),
    refetchInterval: 60_000,
  });
export function useMarkComplianceReminderRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markComplianceReminderRead,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
