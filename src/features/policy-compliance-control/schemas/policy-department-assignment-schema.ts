import { z } from "zod";

export const policyDepartmentAssignmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});

const departmentSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});

export const policyDepartmentAssignmentsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      policyCode: z.string(),
      title: z.string(),
      updatedAt: z.string(),
      departments: z.array(departmentSchema),
    }),
  ),
  departments: z.array(departmentSchema),
  departmentsTruncated: z.boolean(),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const assignPolicyDepartmentsRequestSchema = z
  .object({ departmentIds: z.array(z.uuid()).max(200) })
  .strict();

export const assignedPolicyDepartmentsSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  departmentIds: z.array(z.uuid()),
});

export type PolicyDepartmentAssignmentQuery = z.infer<
  typeof policyDepartmentAssignmentQuerySchema
>;
export type PolicyDepartmentAssignments = z.infer<
  typeof policyDepartmentAssignmentsSchema
>;
export type PolicyDepartmentAssignment =
  PolicyDepartmentAssignments["items"][number];
export type AssignPolicyDepartmentsRequest = z.infer<
  typeof assignPolicyDepartmentsRequestSchema
>;
export type AssignedPolicyDepartments = z.infer<
  typeof assignedPolicyDepartmentsSchema
>;
