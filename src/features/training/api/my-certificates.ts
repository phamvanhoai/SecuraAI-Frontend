import { apiRequest } from "@/lib/api/api-client";
import { myCertificatesSchema } from "../schemas/my-certificates-schema";

export async function getMyCertificates(
  page: number,
  q: string,
  signal?: AbortSignal,
) {
  return myCertificatesSchema.parse(
    await apiRequest<unknown>("/api/training/my-certificates", {
      target: "same-origin",
      query: { page, limit: 10, q },
      ...(signal ? { signal } : {}),
    }),
  );
}
