import { z } from "zod";

const actorSchema = z.object({ id: z.uuid(), name: z.string() }).nullable();
const nullableDate = z.string().datetime().nullable();

export const policyVersionHistoryListSchema = z.object({
  canViewDrafts: z.boolean(),
  items: z.array(
    z.object({
      policyId: z.uuid(),
      policyCode: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      versionId: z.uuid(),
      versionNumber: z.string(),
      changeSummary: z.string().nullable(),
      status: z.string(),
      effectiveDate: nullableDate,
      createdAt: z.string().datetime(),
      publishedAt: nullableDate,
      createdBy: actorSchema,
      publishedBy: actorSchema,
    }),
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const policyVersionHistoryDetailSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  version: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    changeSummary: z.string().nullable(),
    status: z.string(),
    effectiveDate: nullableDate,
    createdAt: z.string().datetime(),
    publishedAt: nullableDate,
    createdBy: actorSchema,
    publishedBy: actorSchema,
  }),
});

export type PolicyVersionHistoryItem = z.infer<
  typeof policyVersionHistoryListSchema
>["items"][number];
export type PolicyVersionHistoryQuery = {
  page: number;
  limit: number;
  q?: string;
  status: "all" | "draft" | "published" | "archived";
};
