"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionUser } from "../api/get-session-user";

export function useSessionUser() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getSessionUser,
    retry: false,
  });
}
