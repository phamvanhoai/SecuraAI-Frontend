import { z } from "zod";

const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const policyControlMappingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
});

export const frameworkControlsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().min(1).max(100).optional(),
});

const frameworkSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  version: z.string().nullable(),
});

export const complianceFrameworksSchema = z.array(
  frameworkSchema.extend({
    description: z.string().nullable(),
    controlCount: z.number().int(),
  }),
);

export const frameworkControlsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      parentControlId: z.uuid().nullable(),
    }),
  ),
  pagination: paginationSchema,
});

export const policyControlMappingsSchema = z.object({
  items: z.array(
    z.object({
      policyId: z.uuid(),
      policyCode: z.string(),
      title: z.string(),
      versionId: z.uuid(),
      versionNumber: z.string(),
      publishedAt: z.string().nullable(),
      mappings: z.array(
        z.object({
          controlId: z.uuid(),
          controlCode: z.string(),
          controlTitle: z.string(),
          notes: z.string().nullable(),
          framework: frameworkSchema,
        }),
      ),
    }),
  ),
  pagination: paginationSchema,
});

export const replacePolicyControlMappingsRequestSchema = z.object({
  mappings: z.array(
    z.object({
      controlId: z.uuid(),
      notes: z.string().max(1000).nullable().optional(),
    }),
  ),
});

export const replacePolicyControlMappingsResponseSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  versionId: z.uuid(),
  frameworkId: z.uuid(),
  mappings: replacePolicyControlMappingsRequestSchema.shape.mappings,
});

export type PolicyControlMappingQuery = z.infer<
  typeof policyControlMappingQuerySchema
>;
export type FrameworkControlsQuery = z.infer<
  typeof frameworkControlsQuerySchema
>;
export type ComplianceFramework = z.infer<
  typeof complianceFrameworksSchema
>[number];
export type FrameworkControl = z.infer<
  typeof frameworkControlsSchema
>["items"][number];
export type PolicyControlMappingItem = z.infer<
  typeof policyControlMappingsSchema
>["items"][number];
export type ReplacePolicyControlMappingsRequest = z.infer<
  typeof replacePolicyControlMappingsRequestSchema
>;
