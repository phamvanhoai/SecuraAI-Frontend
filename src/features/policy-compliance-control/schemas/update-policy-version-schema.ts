import { z } from "zod";

const optionalTrimmedText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => (value === "" ? undefined : value));

export const updatePolicyVersionFormSchema = z
  .object({
    policyId: z.uuid("Enter a valid policy ID."),
    title: optionalTrimmedText(
      255,
      "Policy title must not exceed 255 characters.",
    ).refine((value) => value === undefined || value.length >= 3, {
      message: "Policy title must contain at least 3 characters.",
    }),
    description: optionalTrimmedText(
      2_000,
      "Description must not exceed 2,000 characters.",
    ),
    versionNumber: z
      .string()
      .trim()
      .min(1, "New version number is required.")
      .max(30, "Version number must not exceed 30 characters."),
    content: z
      .string()
      .trim()
      .min(1, "Policy content is required.")
      .max(500_000, "Policy content is too long."),
    changeSummary: z
      .string()
      .trim()
      .min(1, "Change summary is required.")
      .max(5_000, "Change summary must not exceed 5,000 characters."),
  })
  .strict();

export const updatePolicyVersionRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().max(2_000).nullable().optional(),
    versionNumber: z.string().trim().min(1).max(30),
    content: z.string().trim().min(1).max(500_000),
    changeSummary: z.string().trim().min(1).max(5_000),
  })
  .strict();

export const newPolicyVersionSchema = z
  .object({
    policyId: z.uuid(),
    policyCode: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    ownerUserId: z.uuid().nullable(),
    policyStatus: z.literal("draft"),
    version: z.object({
      id: z.uuid(),
      versionNumber: z.string(),
      content: z.string(),
      changeSummary: z.string().nullable(),
      status: z.literal("draft"),
      createdByUserId: z.uuid().nullable(),
      createdAt: z.string(),
    }),
    updatedAt: z.string(),
  })
  .strict();

export const publishedPolicyForNewVersionSchema = z
  .object({
    id: z.uuid(),
    policyCode: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    currentVersion: z.string().nullable(),
    content: z.string().optional(),
    changeSummary: z.string().nullable().optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    eligibleForNewVersion: z.boolean().optional(),
    updatedAt: z.string(),
  })
  .strict();

export const publishedPoliciesForNewVersionSchema = z.array(
  publishedPolicyForNewVersionSchema,
);

export type UpdatePolicyVersionFormInput = z.input<
  typeof updatePolicyVersionFormSchema
>;
export type UpdatePolicyVersionFormValues = z.output<
  typeof updatePolicyVersionFormSchema
>;
export type UpdatePolicyVersionRequest = z.infer<
  typeof updatePolicyVersionRequestSchema
>;
export type NewPolicyVersion = z.infer<typeof newPolicyVersionSchema>;
export type PublishedPolicyForNewVersion = z.infer<
  typeof publishedPolicyForNewVersionSchema
>;
