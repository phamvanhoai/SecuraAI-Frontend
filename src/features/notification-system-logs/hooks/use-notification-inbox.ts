"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import {
  getNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notification-inbox";
const inboxKey = (userId: string | undefined) =>
  ["notifications", "inbox", userId] as const;
export function useNotificationInbox(userId: string | undefined, limit = 50, unreadOnly = false) {
  return useQuery({
    queryKey: [...inboxKey(userId), limit, unreadOnly],
    queryFn: ({ signal }) => getNotificationInbox(limit, signal, unreadOnly),
    enabled: Boolean(userId),
    refetchInterval: (query) => {
      const error = query.state.error;
      return error instanceof ApiError && [401, 403].includes(error.status)
        ? false
        : 10_000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403].includes(error.status)) &&
      count < 1,
  });
}
export function useReadNotifications(userId: string | undefined) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: inboxKey(userId) });
  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refresh,
    retry: false,
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refresh,
    retry: false,
  });
  return { read, markAll };
}
