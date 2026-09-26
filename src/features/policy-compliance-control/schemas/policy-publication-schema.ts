import { z } from "zod";

const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const publishablePolicySchema = z.object({
  id: z.string().uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  status: z.string(),
  draftVersion: z.object({
    id: z.string().uuid(),
    versionNumber: z.string(),
    status: z.string(),
    createdByUserId: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
  }),
  updatedAt: z.string().datetime(),
});

export const publishablePolicyListSchema = z.object({
  items: z.array(publishablePolicySchema),
  pagination: paginationSchema,
});

export const policyReviewDetailSchema = z.object({
  policyId: z.string().uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  policyStatus: z.string(),
  updatedAt: z.string().datetime(),
  version: z.object({
    id: z.string().uuid(),
    versionNumber: z.string(),
    content: z.string(),
    changeSummary: z.string().nullable(),
    status: z.string(),
    effectiveDate: z.string().datetime().nullable(),
    createdByUserId: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
  }),
});

export const requestPolicyRevisionInputSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(3, "Revision instructions must contain at least 3 characters.")
    .max(5_000, "Revision instructions must not exceed 5,000 characters."),
});

export const policyRevisionRequestSchema = policyReviewDetailSchema.extend({
  decision: z.object({
    id: z.string().uuid(),
    action: z.literal("REVISION_REQUESTED"),
    comment: z.string(),
    actorUserId: z.string().uuid(),
    decidedAt: z.string().datetime(),
  }),
});

export const approvedPolicySchema = policyReviewDetailSchema.extend({
  decision: z.object({
    id: z.string().uuid(),
    action: z.literal("APPROVED"),
    comment: z.string().nullable(),
    actorUserId: z.string().uuid(),
    decidedAt: z.string().datetime(),
  }),
});

export const rejectPolicyInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Rejection reason must contain at least 3 characters.")
    .max(5_000, "Rejection reason must not exceed 5,000 characters."),
});

export const rejectedPolicySchema = policyReviewDetailSchema.extend({
  decision: z.object({
    id: z.string().uuid(),
    action: z.literal("REJECTED"),
    comment: z.string(),
    actorUserId: z.string().uuid(),
    decidedAt: z.string().datetime(),
  }),
});

export const rejectedPolicyListItemSchema = z.object({
  policyId: z.string().uuid(),
  policyCode: z.string(),
  title: z.string(),
  ownerUserId: z.string().uuid().nullable(),
  version: z.object({
    id: z.string().uuid(),
    versionNumber: z.string(),
    status: z.literal("rejected"),
  }),
  rejection: z.object({
    id: z.string().uuid(),
    reason: z.string(),
    rejectedByUserId: z.string().uuid(),
    rejectedByName: z.string(),
    rejectedAt: z.string().datetime(),
  }),
});

export const rejectedPolicyListSchema = z.object({
  items: z.array(rejectedPolicyListItemSchema),
  pagination: paginationSchema,
});

export const publishedPolicySchema = z.object({
  policyId: z.string().uuid(),
  policyCode: z.string(),
  title: z.string(),
  status: z.string(),
  publishedVersion: z.object({
    id: z.string().uuid(),
    versionNumber: z.string(),
    status: z.string(),
    effectiveDate: z.string().datetime().nullable(),
    publishedByUserId: z.string().uuid().nullable(),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  }),
});

export type PublishablePolicy = z.infer<typeof publishablePolicySchema>;
export type PublishablePolicyList = z.infer<typeof publishablePolicyListSchema>;
export type PolicyReviewDetail = z.infer<typeof policyReviewDetailSchema>;
export type RequestPolicyRevisionInput = z.infer<
  typeof requestPolicyRevisionInputSchema
>;
export type PolicyRevisionRequest = z.infer<typeof policyRevisionRequestSchema>;
export type ApprovedPolicy = z.infer<typeof approvedPolicySchema>;
export type RejectPolicyInput = z.infer<typeof rejectPolicyInputSchema>;
export type RejectedPolicy = z.infer<typeof rejectedPolicySchema>;
export type RejectedPolicyListItem = z.infer<typeof rejectedPolicyListItemSchema>;
export type RejectedPolicyList = z.infer<typeof rejectedPolicyListSchema>;
export type RejectedPolicyQuery = {
  page: number;
  limit: number;
  q?: string;
  sortOrder: "asc" | "desc";
};
export type PublishedPolicy = z.infer<typeof publishedPolicySchema>;

export type PublishablePolicyQuery = {
  page: number;
  limit: number;
  q?: string;
  sortBy: "policyCode" | "title" | "updatedAt";
  sortOrder: "asc" | "desc";
};
