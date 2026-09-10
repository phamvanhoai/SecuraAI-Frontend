import { apiRequest } from "@/lib/api/api-client";
import {
  modelConfigurationListSchema,
  modelConfigurationSchema,
  type ModelConfiguration,
  type ModelConfigurationForm,
  type ModelConfigurationList,
} from "../schemas/model-configuration-schema";
export type ModelConfigurationQuery = {
  page: number;
  limit: number;
  modelName?: string;
  active?: boolean;
};

export type ModelConfigurationMetrics = {
  configurations: number;
  activeVersions: number;
  detectionRules: number;
  enabledRules: number;
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

export async function getModelConfigurationMetrics(
  signal?: AbortSignal,
): Promise<ModelConfigurationMetrics> {
  const firstPage = await listModelConfigurations(
    { page: 1, limit: 100 },
    signal,
  );
  const remainingPages = await Promise.all(
    Array.from(
      { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
      (_, index) =>
        listModelConfigurations({ page: index + 2, limit: 100 }, signal),
    ),
  );
  const items = [firstPage, ...remainingPages].flatMap(
    (result) => result.items,
  );

  return {
    configurations: firstPage.pagination.total,
    activeVersions: items.filter((item) => item.active).length,
    detectionRules: items.reduce(
      (total, item) => total + item.parameters.rules.length,
      0,
    ),
    enabledRules: items.reduce(
      (total, item) =>
        total + item.parameters.rules.filter((rule) => rule.enabled).length,
      0,
    ),
  };
}
export async function createModelConfiguration(
  values: ModelConfigurationForm,
): Promise<ModelConfiguration> {
  const { modelPath, ...required } = values;
  return modelConfigurationSchema.parse(
    await apiRequest<unknown>("/api/ai-alerts/models", {
      target: "same-origin",
      method: "POST",
      body: { ...required, ...(modelPath ? { modelPath } : {}) },
    }),
  );
}
export async function activateModelConfiguration(
  id: string,
): Promise<ModelConfiguration> {
  return modelConfigurationSchema.parse(
    await apiRequest<unknown>(
      `/api/ai-alerts/models/${encodeURIComponent(id)}/activate`,
      { target: "same-origin", method: "POST" },
    ),
  );
}
