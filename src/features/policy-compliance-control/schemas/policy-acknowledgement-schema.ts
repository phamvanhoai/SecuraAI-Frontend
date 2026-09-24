import { z } from "zod";
const dt = z.string().datetime().nullable();
export const employeePolicyListSchema = z.object({
  items: z.array(
    z.object({
      policyId: z.uuid(),
      policyCode: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      versionId: z.uuid(),
      versionNumber: z.string(),
      effectiveDate: dt,
      publishedAt: dt,
      acknowledgedAt: dt,
    }),
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export const employeePolicyDetailSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  version: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    changeSummary: z.string().nullable(),
    effectiveDate: dt,
    publishedAt: dt,
  }),
  acknowledgedAt: dt,
});
export const acknowledgementSchema = z.object({
  policyId: z.uuid(),
  versionId: z.uuid(),
  acknowledgedAt: z.string().datetime(),
  alreadyAcknowledged: z.boolean(),
});
export type EmployeePolicy = z.infer<
  typeof employeePolicyListSchema
>["items"][number];
export type EmployeePolicyQuery = {
  page: number;
  limit: number;
  q?: string;
  status: "all" | "pending" | "acknowledged";
};
