import { z } from "zod";
const evidenceSchema = z.object({ id: z.uuid(), description: z.string().nullable(), validUntil: z.string().nullable(), createdAt: z.string(), uploadedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(), file: z.object({ id: z.uuid(), name: z.string(), mimeType: z.string().nullable(), sizeBytes: z.number().nullable(), checksum: z.string().nullable() }) });
export const evidenceAssessmentsSchema = z.object({ items: z.array(z.object({ id: z.uuid(), complianceStatus: z.string(), score: z.number().nullable(), assessedAt: z.string(), control: z.object({ code: z.string(), title: z.string(), framework: z.object({ code: z.string(), version: z.string().nullable() }) }), evidence: z.array(evidenceSchema) })), pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }) });
export const uploadedEvidenceSchema = evidenceSchema;
export type EvidenceAssessments = z.infer<typeof evidenceAssessmentsSchema>;
export type EvidenceAssessment = EvidenceAssessments["items"][number];
