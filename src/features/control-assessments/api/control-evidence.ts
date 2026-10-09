import { apiRequest } from "@/lib/api/api-client";
import {
  addControlEvidenceResultSchema,
  addControlEvidenceSchema,
  linkControlEvidenceSchema,
  linkControlEvidenceResultSchema,
  listControlEvidenceQuerySchema,
  controlEvidenceListSchema,
  type AddControlEvidence,
  type LinkControlEvidence,
  type ControlEvidenceQuery,
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
