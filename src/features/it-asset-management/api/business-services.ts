import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { UpdateBusinessServiceInput } from "../schemas/update-business-service-schema";
import {
  businessServiceDeactivationCheckSchema,
  type DeactivateBusinessServiceInput,
} from "../schemas/deactivate-business-service-schema";

export async function checkBusinessServiceDeactivation(
  id: string,
  signal: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/api/business-services/${encodeURIComponent(id)}/deactivation-check`,
    { target: "same-origin", signal },
  );
  const parsed = businessServiceDeactivationCheckSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Unable to verify service usage. Reload before deactivating.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
export async function deactivateBusinessService(
  id: string,
  input: DeactivateBusinessServiceInput,
) {
  const data = await apiRequest<unknown>(
    `/api/business-services/${encodeURIComponent(id)}/deactivate`,
    { target: "same-origin", method: "POST", body: input },
  );
  const parsed = businessServiceSchema.safeParse(data);
  if (!parsed.success || parsed.data.status !== "inactive")
    throw new ApiError(
      "Deactivation response could not be verified. Check the list before retrying.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}

export async function updateBusinessService(
  id: string,
  input: UpdateBusinessServiceInput,
) {
  const data = await apiRequest<unknown>(
    `/api/business-services/${encodeURIComponent(id)}`,
    { target: "same-origin", method: "PATCH", body: input },
  );
  const parsed = businessServiceSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Update response could not be verified. Reload details before retrying.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
import {
  businessServiceOwnersSchema,
  type CreateBusinessServiceOutput,
} from "../schemas/create-business-service-schema";
import {
  businessServiceAssetsSchema,
  businessServiceListSchema,
  businessServiceSchema,
  type BusinessServiceListQuery,
} from "../schemas/business-service-schema";

export async function createBusinessService(
  input: CreateBusinessServiceOutput,
) {
  const data = await apiRequest<unknown>("/api/business-services", {
    target: "same-origin",
    method: "POST",
    body: input,
  });
  const parsed = businessServiceSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "The create response could not be verified. Check the list before submitting again.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
export async function getBusinessServiceOwners(q: string, signal: AbortSignal) {
  const data = await apiRequest<unknown>(
    "/api/business-services/owner-options",
    { target: "same-origin", query: q ? { q } : {}, signal },
  );
  const parsed = businessServiceOwnersSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError("Invalid service owner response.", 502, "UNKNOWN_ERROR");
  return parsed.data;
}

export async function listBusinessServices(
  query: BusinessServiceListQuery,
  signal: AbortSignal,
) {
  const data = await apiRequest<unknown>("/api/business-services", {
    target: "same-origin",
    query,
    signal,
  });
  const parsed = businessServiceListSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Invalid business service response.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
export async function getBusinessService(id: string, signal: AbortSignal) {
  const data = await apiRequest<unknown>(
    `/api/business-services/${encodeURIComponent(id)}`,
    { target: "same-origin", signal },
  );
  const parsed = businessServiceSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError(
      "Invalid business service response.",
      502,
      "UNKNOWN_ERROR",
    );
  return parsed.data;
}
export async function listBusinessServiceAssets(
  id: string,
  page: number,
  signal: AbortSignal,
) {
  const data = await apiRequest<unknown>(
    `/api/business-services/${encodeURIComponent(id)}/assets`,
    { target: "same-origin", query: { page, limit: 10 }, signal },
  );
  const parsed = businessServiceAssetsSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError("Invalid linked assets response.", 502, "UNKNOWN_ERROR");
  return parsed.data;
}
