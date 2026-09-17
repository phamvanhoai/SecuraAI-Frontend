"use client";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getTrainingCertificate,
  issueTrainingCertificate,
} from "../api/certificate";

export function useTrainingCertificate(id: string) {
  return useQuery({
    queryKey: ["training", "certificate", id],
    queryFn: ({ signal }) => getTrainingCertificate(id, signal),
  });
}
export function useIssueTrainingCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["training", "certificate", "issue"],
    mutationFn: issueTrainingCertificate,
    retry: false,
    onSuccess: async (data) => {
      client.setQueryData(["training", "certificate", data.enrollmentId], data);
      await client.invalidateQueries({ queryKey: ["training", "completion"] });
    },
  });
}

export function useCertificateIssuancePending() {
  return (
    useIsMutating({ mutationKey: ["training", "certificate", "issue"] }) > 0
  );
}
