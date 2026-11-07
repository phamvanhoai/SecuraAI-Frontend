"use client";

import { useIsMutating, useQuery } from "@tanstack/react-query";
import { getSessionUser } from "../api/get-session-user";

export function useSessionUser() {
  const changingPassword = useIsMutating({ mutationKey: ["auth", "change-password"] }) > 0;
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getSessionUser,
    enabled: !changingPassword,
    retry: false,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
  });
}
