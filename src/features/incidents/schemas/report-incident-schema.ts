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
  classified: z.boolean(),
  classificationCount: z.number().int().min(0),
  lastClassification: z
    .object({
      classifiedAt: z.string().datetime(),
      classifiedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
      rationale: z.string().nullable(),
    })
    .nullable(),
  currentAssignment: z
    .object({
      assignedAt: z.string().datetime(),
      assignee: z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
    })
    .nullable(),
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
export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export const classifyIncidentFormSchema = z.object({
  severity: severitySchema,
  rationale: z
    .string()
    .trim()
    .min(10, "Explain the classification in at least 10 characters")
    .max(2000),
});
export const assignmentOptionsSchema = z.object({
  users: z.array(
    z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
  ),
});
export const assignIncidentFormSchema = z.object({
  assigneeUserId: z.uuid("Select a handler"),
  note: z
    .string()
    .trim()
    .min(10, "Explain the assignment in at least 10 characters")
    .max(2000),
});
export type ReportIncidentForm = z.infer<typeof reportIncidentFormSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type ClassifyIncidentForm = z.infer<typeof classifyIncidentFormSchema>;
export type IncidentSeverity = z.infer<typeof severitySchema>;
export type AssignIncidentForm = z.infer<typeof assignIncidentFormSchema>;
