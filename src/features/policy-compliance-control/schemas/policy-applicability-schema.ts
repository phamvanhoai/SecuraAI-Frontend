import { z } from "zod";

export const policyRoles = [
  "ADMIN",
  "SECURITY_OFFICER",
  "EXECUTIVE",
  "EMPLOYEE",
] as const;

export const definePolicyApplicabilitySchema = z
  .object({
    departmentIds: z.array(z.uuid()).max(200),
    roleCodes: z.array(z.enum(policyRoles)).max(4),
    userGroups: z.array(z.string().trim().min(1).max(100)).max(200),
    organizationalScope: z.string().trim().max(2000).nullable(),
    rationale: z
      .string()
      .trim()
      .min(
        20,
        "Provide at least 20 characters explaining why this scope applies.",
      )
      .max(2000),
    referenceBasis: z
      .string()
      .trim()
      .min(5, "Provide the policy, standard, law, or business reference.")
      .max(2000),
  })
  .refine(
    (value) =>
      value.departmentIds.length > 0 ||
      value.roleCodes.length > 0 ||
      value.userGroups.length > 0 ||
      Boolean(value.organizationalScope),
    {
      message: "Select or describe at least one applicability scope.",
      path: ["organizationalScope"],
    },
  );

const applicabilityValueSchema = definePolicyApplicabilitySchema.extend({
  definedByUserId: z.uuid(),
  definedAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const policyApplicabilitySchema = z.object({
  policyId: z.uuid(),
  versionId: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  editable: z.boolean(),
  applicability: applicabilityValueSchema.nullable(),
  options: z.object({
    departments: z.array(
      z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
    ),
    roles: z.array(z.enum(policyRoles)),
  }),
});

export type DefinePolicyApplicability = z.infer<
  typeof definePolicyApplicabilitySchema
>;
export type PolicyApplicability = z.infer<typeof policyApplicabilitySchema>;
