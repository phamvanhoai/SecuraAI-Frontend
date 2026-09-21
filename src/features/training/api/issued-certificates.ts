import { apiRequest } from "@/lib/api/api-client";
import { issuedCertificatesSchema } from "../schemas/issued-certificates-schema";

export async function getIssuedCertificates(
  page: number,
  q: string,
  signal?: AbortSignal,
) {
  return issuedCertificatesSchema.parse(
    await apiRequest<unknown>("/api/training/certificates", {
      target: "same-origin",
      query: { page, limit: 10, q },
      ...(signal ? { signal } : {}),
    }),
  );
}
