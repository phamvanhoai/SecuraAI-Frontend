import { useQuery } from "@tanstack/react-query";
import { getIssuedCertificates } from "../api/issued-certificates";

export function useIssuedCertificates(
  page: number,
  q: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["training", "issued-certificates", page, q],
    queryFn: ({ signal }) => getIssuedCertificates(page, q, signal),
    enabled,
  });
}
