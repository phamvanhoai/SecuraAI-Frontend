import { z } from "zod";
export const reportIncidentFormSchema = z.object({
  title: z.string().trim().min(5, "Enter at least 5 characters").max(255),
  description: z
    .string()
    .trim()
    .min(20, "Describe what happened in at least 20 characters")
    .max(10_000),
  category: z.enum([
    "phishing",
    "malware",
    "account_compromise",
    "data_exposure",
    "network",
    "physical",
    "other",
  ]),
  occurredAt: z.string(),
});
export const incidentSchema = z.object({
  id: z.uuid(),
  incidentCode: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().nullable(),
  severity: z.string(),
  status: z.string(),
  occurredAt: z.string().datetime().nullable(),
  detectedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export const myIncidentsSchema = z.object({
  items: z.array(incidentSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type ReportIncidentForm = z.infer<typeof reportIncidentFormSchema>;
export type Incident = z.infer<typeof incidentSchema>;
