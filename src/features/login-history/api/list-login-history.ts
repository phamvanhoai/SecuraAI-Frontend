import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  loginHistoryListSchema,
  loginHistoryQuerySchema,
  type LoginHistoryQuery,
  type LoginHistoryList,
} from "../schemas/login-history-schema";

export async function listLoginHistory(
  query: LoginHistoryQuery,
  signal?: AbortSignal,
): Promise<LoginHistoryList> {
  const data = await apiRequest<unknown>("/api/login-history", {
    method: "GET",
    target: "same-origin",
    query: loginHistoryQuerySchema.parse(query),
    ...(signal ? { signal } : {}),
  });
  const parsed = loginHistoryListSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Unable to read login history. Please try again.",
      502,
      "SERVER_ERROR",
    );
  return parsed.data;
}
