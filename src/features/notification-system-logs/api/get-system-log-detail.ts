import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { systemLogDetailSchema } from "../schemas/system-log-schema";

export async function getSystemLogDetail(logId: string, signal?: AbortSignal) {
  const data = await apiRequest<unknown>(
    `/api/system-logs/${encodeURIComponent(logId)}`,
    { target: "same-origin", ...(signal ? { signal } : {}) },
  );
  const parsed = systemLogDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      "The system-log detail response could not be verified.",
      502,
      "UNKNOWN_ERROR",
    );
  }
  return parsed.data;
}
