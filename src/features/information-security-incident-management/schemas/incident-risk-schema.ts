import { z } from "zod";
const riskSchema = z.object({
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  status: z.string(),
  reviewDate: z.iso.datetime({ offset: true }).nullable(),
});
export const incidentRiskOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  risks: z.array(riskSchema.extend({ linked: z.boolean() })),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(1),
  }),
});
export const linkIncidentRiskFormSchema = z.object({
  riskId: z.uuid("Select an existing risk"),
});
export const linkedIncidentRiskSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
  }),
  risk: riskSchema,
  linkedAt: z.iso.datetime({ offset: true }),
});
export type LinkIncidentRiskForm = z.infer<typeof linkIncidentRiskFormSchema>;
