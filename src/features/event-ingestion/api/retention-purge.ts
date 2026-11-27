import { apiRequest } from "@/lib/api/api-client";
import {
  retentionPurgeRunResultSchema,
  retentionPurgeStatusSchema,
  runRetentionPurgePayloadSchema,
  type RetentionPurgeRunResult,
  type RetentionPurgeStatus,
  type RunRetentionPurgeInput,
} from "../schemas/retention-purge-schema";

export async function getRetentionPurgeStatus(): Promise<RetentionPurgeStatus> {
  const data = await apiRequest<unknown>("/api/event-governance/retention-purge/status", {
    target: "same-origin",
    method: "GET",
  });

  return retentionPurgeStatusSchema.parse(data);
}

export async function runRetentionPurge(
  payload?: RunRetentionPurgeInput,
): Promise<RetentionPurgeRunResult> {
  const normalizedInput = {
    ...(payload?.dryRun !== undefined ? { dryRun: payload.dryRun } : {}),
    ...(payload?.eventFamily !== undefined ? { eventFamily: payload.eventFamily } : {}),
    ...(payload?.batchSize !== undefined ? { batchSize: payload.batchSize } : {}),
    ...(payload?.maxBatches !== undefined ? { maxBatches: payload.maxBatches } : {}),
  };

  const validated = runRetentionPurgePayloadSchema.parse(normalizedInput);

  const data = await apiRequest<unknown>("/api/event-governance/retention-purge/run", {
    target: "same-origin",
    method: "POST",
    body: validated,
  });

  return retentionPurgeRunResultSchema.parse(data);
}
