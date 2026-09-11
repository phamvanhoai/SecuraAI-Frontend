import { z } from "zod";

const policyCodeSchema = z
  .string()
  .trim()
  .min(2, "Policy code must contain at least 2 characters.")
  .max(50, "Policy code must not exceed 50 characters.")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Policy code may only contain letters, numbers, periods, underscores, and hyphens.",
  )
  .transform((value) => value.toUpperCase());

export const createPolicyDraftSchema = z.object({
  policyCode: policyCodeSchema,
  title: z
    .string()
    .trim()
    .min(3, "Policy title must contain at least 3 characters.")
    .max(255, "Policy title must not exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(2_000, "Description must not exceed 2,000 characters.")
    .optional(),
  versionNumber: z
    .string()
    .trim()
    .min(1, "Version is required.")
    .max(30, "Version must not exceed 30 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Policy content is required.")
    .max(500_000, "Policy content is too long."),
});

export const updatePolicyDraftSchema = createPolicyDraftSchema
  .omit({ policyCode: true })
  .extend({
    description: z
      .string()
      .trim()
      .max(2_000, "Description must not exceed 2,000 characters.")
      .nullable()
      .optional(),
    changeSummary: z
      .string()
      .trim()
      .max(5_000, "Change summary must not exceed 5,000 characters.")
      .nullable()
      .optional(),
  });

export const policyDraftQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ownedPolicyDraftSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  policyStatus: z.string(),
  version: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    changeSummary: z.string().nullable(),
    status: z.string(),
    createdByUserId: z.uuid().nullable(),
    createdAt: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const policyDraftListSchema = z.object({
  items: z.array(ownedPolicyDraftSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const createdPolicyDraftSchema = z.object({
  id: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  status: z.string(),
  currentVersion: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    status: z.string(),
    createdAt: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreatePolicyDraftInput = z.input<typeof createPolicyDraftSchema>;
export type CreatePolicyDraftRequest = z.output<typeof createPolicyDraftSchema>;
export type UpdatePolicyDraftInput = z.input<typeof updatePolicyDraftSchema>;
export type UpdatePolicyDraftRequest = z.output<typeof updatePolicyDraftSchema>;
export type PolicyDraftQuery = z.infer<typeof policyDraftQuerySchema>;
export type OwnedPolicyDraft = z.infer<typeof ownedPolicyDraftSchema>;
export type PolicyDraftList = z.infer<typeof policyDraftListSchema>;
export type CreatedPolicyDraft = z.infer<typeof createdPolicyDraftSchema>;
