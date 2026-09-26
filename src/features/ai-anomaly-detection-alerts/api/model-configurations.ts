import { apiRequest } from "@/lib/api/api-client";
import {
  modelConfigurationListSchema,
  type ModelConfigurationList,
} from "../schemas/model-configuration-schema";

export type ModelConfigurationQuery = {
  page: number;
  limit: number;
  modelName?: string;
  status?: "development" | "validated" | "deployed" | "retired";
};

export async function listModelConfigurations(
  query: ModelConfigurationQuery,
  signal?: AbortSignal,
): Promise<ModelConfigurationList> {
  return modelConfigurationListSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/models", {
      target: "same-origin",
      query,
      ...(signal ? { signal } : {}),
    }),
  );
}
