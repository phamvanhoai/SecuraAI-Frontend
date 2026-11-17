"use client";

import { useIsMutating, useQuery } from "@tanstack/react-query";
import { getSessionUser } from "../api/get-session-user";

export function useSessionUser(options: { monitor?: boolean } = {}) {
  const changingPassword = useIsMutating({ mutationKey: ["auth", "change-password"] }) > 0;
  const monitor = options.monitor === true;
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getSessionUser,
    enabled: !changingPassword,
    retry: false,
    staleTime: monitor ? 0 : 5_000,
    refetchInterval: monitor ? 5_000 : false,
    refetchIntervalInBackground: monitor,
    refetchOnWindowFocus: true,
  });
}
