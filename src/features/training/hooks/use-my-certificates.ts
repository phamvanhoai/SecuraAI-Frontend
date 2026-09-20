"use client";
import { useQuery } from "@tanstack/react-query";
import { getMyCertificates } from "../api/my-certificates";

export function useMyCertificates(page: number, q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["training", "my-certificates", page, q],
    queryFn: ({ signal }) => getMyCertificates(page, q, signal),
    enabled,
  });
}
