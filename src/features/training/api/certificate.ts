import { apiRequest } from "@/lib/api/api-client";
import { trainingCertificateSchema } from "../schemas/certificate-schema";

export async function getTrainingCertificate(id: string, signal?: AbortSignal) {
  return trainingCertificateSchema.parse(
    await apiRequest<unknown>(
      `/api/training/enrollments/${encodeURIComponent(id)}/certificate`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function issueTrainingCertificate(id: string) {
  return trainingCertificateSchema.parse(
    await apiRequest<unknown>(
      `/api/training/enrollments/${encodeURIComponent(id)}/certificate`,
      { target: "same-origin", method: "POST" },
    ),
  );
}
