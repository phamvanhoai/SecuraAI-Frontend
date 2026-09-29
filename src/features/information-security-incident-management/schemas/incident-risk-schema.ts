import { z } from "zod";
const riskSchema = z.object({
  id: z.uuid(),
  riskCode: z.string(),
  title: z.string(),
  status: z.string(),
  reviewDate: z.iso.date().nullable(),
});
export const incidentRiskOptionsSchema = z.object({
  incident: z.object({
    id: z.uuid(),
    incidentCode: z.string(),
    title: z.string(),
    status: z.string(),
  }),
  risks: z.array(riskSchema.extend({ linked: z.boolean() })),
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
