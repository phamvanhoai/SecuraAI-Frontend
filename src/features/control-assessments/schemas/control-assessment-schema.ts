import { z } from "zod";
import { implementationSchema } from "./control-catalog-schema";
const assessment = z.object({
  id: z.uuid(),
  testMethod: z.string().nullable(),
  result: z
    .enum(["effective", "partially_effective", "ineffective"])
    .nullable(),
  effectiveness: z.number().nullable(),
  notes: z.string().nullable(),
  assessedAt: z.iso.datetime({ offset: true }),
  assessor: z.object({ id: z.uuid(), fullName: z.string() }),
});
export const controlAssessmentListSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      controlCode: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      canManageEvidence: z.boolean().default(false),
      applicability: z.string(),
      implementationStatus: implementationSchema,
      owner: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
      evidence: z.array(
        z.object({
          id: z.uuid(),
          name: z.string(),
          source: z.string(),
          collectedAt: z.iso.datetime({ offset: true }),
          reviewedAt: z.iso.datetime({ offset: true }).nullable(),
        }),
      ),
      assessments: z.array(assessment),
    }),
  ),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export function resultForEffectiveness(
  score: number,
): "effective" | "partially_effective" | "ineffective" {
  return score >= 80
    ? "effective"
    : score >= 50
      ? "partially_effective"
      : "ineffective";
}
export const createAssessmentSchema = z
  .object({
    testMethod: z.string().trim().min(3).max(1000),
    result: z.enum(["effective", "partially_effective", "ineffective"]),
    effectiveness: z.number().min(0).max(100).multipleOf(0.01),
    notes: z.string().trim().min(10).max(5000),
    implementationStatus: implementationSchema.optional(),
    expectedImplementationStatus: implementationSchema.optional(),
    implementationChangeReason: z.string().trim().min(10).max(2000).optional(),
  })
  .superRefine((value, context) => {
    if (value.result !== resultForEffectiveness(value.effectiveness))
      context.addIssue({
        code: "custom",
        path: ["result"],
        message:
          "Result must match effectiveness: below 50% Ineffective, below 80% Partially effective, otherwise Effective.",
      });
    if (
      (value.implementationStatus === undefined) !==
      (value.expectedImplementationStatus === undefined)
    )
      context.addIssue({
        code: "custom",
        path: ["implementationStatus"],
        message: "Provide both the baseline and selected implementation status",
      });
    if (
      value.implementationStatus !== value.expectedImplementationStatus &&
      !value.implementationChangeReason
    )
      context.addIssue({
        code: "custom",
        path: ["implementationChangeReason"],
        message: "Explain the implementation change in at least 10 characters",
      });
  });
export type ControlAssessmentList = z.infer<typeof controlAssessmentListSchema>;
export type ControlAssessmentItem = ControlAssessmentList["items"][number];
export type CreateAssessment = z.infer<typeof createAssessmentSchema>;
