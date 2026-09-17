"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTrainingReminders,
  markTrainingReminderRead,
} from "../api/reminders";
import type { ReminderFilter } from "../schemas/reminder-schema";

export function useTrainingReminders(
  page: number,
  status: ReminderFilter,
  enabled: boolean,
  userId?: string,
  search = "",
) {
  return useQuery({
    queryKey: ["training", "deadline-reminders", userId, page, status, search],
    queryFn: ({ signal }) =>
      listTrainingReminders(page, status, search, signal),
    enabled: enabled && Boolean(userId),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
export function useMarkTrainingReminderRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markTrainingReminderRead,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["training", "deadline-reminders"],
      }),
  });
}
