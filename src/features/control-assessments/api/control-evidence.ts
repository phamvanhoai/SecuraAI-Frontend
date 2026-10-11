import { apiRequest } from "@/lib/api/api-client";
import {
  addControlEvidenceResultSchema,
  addControlEvidenceSchema,
  linkControlEvidenceSchema,
  unlinkControlEvidenceSchema,
  linkControlEvidenceResultSchema,
  listControlEvidenceQuerySchema,
  controlEvidenceListSchema,
  type AddControlEvidence,
  type LinkControlEvidence,
  type UnlinkControlEvidence,
  type ControlEvidenceQuery,
  uploadControlEvidenceSchema,
  type UploadControlEvidence,
} from "../schemas/control-evidence-schema";
const path = (id: string) =>
  `/api/compliance/controls/${encodeURIComponent(id)}`;
export async function listControlEvidence(
  controlId: string,
  query: ControlEvidenceQuery,
  signal?: AbortSignal,
) {
  return controlEvidenceListSchema.parse(
    await apiRequest<unknown>(`${path(controlId)}/evidence`, {
      target: "same-origin",
      query: listControlEvidenceQuerySchema.parse(query),
      ...(signal ? { signal } : {}),
    }),
  );
}
export async function addControlEvidence(input: {
  controlId: string;
  body: AddControlEvidence;
}) {
  return addControlEvidenceResultSchema.parse(
    await apiRequest<unknown>(`${path(input.controlId)}/evidence`, {
      target: "same-origin",
      method: "POST",
      body: addControlEvidenceSchema.parse(input.body),
    }),
  );
}
export async function linkControlEvidence(input: {
  controlId: string;
  body: LinkControlEvidence;
}) {
  return linkControlEvidenceResultSchema.parse(
    await apiRequest<unknown>(`${path(input.controlId)}/evidence-links`, {
      target: "same-origin",
      method: "POST",
      body: linkControlEvidenceSchema.parse(input.body),
    }),
  );
}
export async function uploadControlEvidence(input: {
  controlId: string;
  body: UploadControlEvidence;
  file: File;
}) {
  const body = uploadControlEvidenceSchema.parse(input.body);
  const form = new FormData();
  form.set("file", input.file);
  Object.entries(body).forEach(([key, value]) =>
    form.set(key, value === null ? "" : value),
  );
  return addControlEvidenceResultSchema.parse(
    await apiRequest<unknown>(`${path(input.controlId)}/evidence-files`, {
      target: "same-origin",
      method: "POST",
      body: form,
    }),
  );
}
export async function unlinkControlEvidence(input: {
  controlId: string;
  evidenceId: string;
  body: UnlinkControlEvidence;
}) {
  return apiRequest<unknown>(
    `${path(input.controlId)}/evidence-links/${encodeURIComponent(input.evidenceId)}`,
    {
      target: "same-origin",
      method: "DELETE",
      body: unlinkControlEvidenceSchema.parse(input.body),
    },
  );
}
