import { apiRequest } from "@/lib/api/api-client";
import {
  catalogControlSchema,
  controlOwnersSchema,
  createControlSchema,
  editControlSchema,
  type CreateControl,
  type EditControl,
} from "../schemas/control-catalog-schema";
export async function getCatalogControl(id: string, signal?: AbortSignal) {
  return catalogControlSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/controls/${encodeURIComponent(id)}`,
      { target: "same-origin", ...(signal ? { signal } : {}) },
    ),
  );
}
export async function listControlOwners(q: string, signal?: AbortSignal) {
  return controlOwnersSchema.parse(
    await apiRequest<unknown>("/api/compliance/controls/owner-options", {
      target: "same-origin",
      query: { q },
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function createControl(body: CreateControl) {
  return catalogControlSchema.parse(
    await apiRequest<unknown>("/api/compliance/controls", {
      target: "same-origin",
      method: "POST",
      body: createControlSchema.parse(body),
    }),
  );
}
export async function editControl(input: { id: string; body: EditControl }) {
  return catalogControlSchema.parse(
    await apiRequest<unknown>(
      `/api/compliance/controls/${encodeURIComponent(input.id)}`,
      {
        target: "same-origin",
        method: "PATCH",
        body: editControlSchema.parse(input.body),
      },
    ),
  );
}
