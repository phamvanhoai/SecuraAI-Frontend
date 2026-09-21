import { z } from "zod";
import { treatmentPlanDetailSchema } from "./treatment-plan-detail-schema";

const normalizedText = (minimum: number, maximum: number, message: string) =>
  z
    .string()
    .trim()
    .min(minimum, message)
    .max(maximum)
    .transform((value) => value.normalize("NFKC").replace(/\s+/gu, " "));

const optionalDescription = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2_000).optional(),
);

const actionSchema = z.object({
  title: normalizedText(3, 255, "Action title must contain at least 3 characters."),
  description: optionalDescription,
  assignedToUserId: z.uuid("Select an action assignee."),
  dueDate: z.iso.date("Select a valid action due date."),
});

export const createTreatmentPlanSchema = z
  .object({
    strategy: z.enum(["avoid", "mitigate", "transfer", "accept"]),
    description: normalizedText(
      10,
      5_000,
      "Description must contain at least 10 characters.",
    ),
    ownerUserId: z.uuid("Select a plan owner."),
    targetDate: z.iso.date("Select a valid target date."),
    actions: z.array(actionSchema).max(100),
  })
  .superRefine((value, context) => {
    if (value.strategy !== "accept" && value.actions.length === 0)
      context.addIssue({
        code: "custom",
        path: ["actions"],
        message: "This strategy requires at least one treatment action.",
      });
    const titles = new Set<string>();
    value.actions.forEach((action, index) => {
      const key = action.title.toLocaleLowerCase("en-US");
      if (titles.has(key))
        context.addIssue({
          code: "custom",
          path: ["actions", index, "title"],
          message: "Action titles must be unique.",
        });
      titles.add(key);
      if (action.dueDate > value.targetDate)
        context.addIssue({
          code: "custom",
          path: ["actions", index, "dueDate"],
          message: "Action due date must not be after the plan target date.",
        });
    });
  });

export const createTreatmentPlanRequestSchema = createTreatmentPlanSchema.extend({
  riskAssessmentId: z.uuid(),
  expectedRiskUpdatedAt: z.iso.datetime({ offset: true }),
});

export const treatmentPlanCreateOptionsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const treatmentPlanCreateOptionsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      fullName: z.string(),
      employeeCode: z.string().nullable(),
      departmentId: z.uuid().nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type CreateTreatmentPlanInput = z.input<typeof createTreatmentPlanSchema>;
export type CreateTreatmentPlanForm = z.infer<typeof createTreatmentPlanSchema>;
export type CreateTreatmentPlanRequest = z.infer<
  typeof createTreatmentPlanRequestSchema
>;
export type TreatmentPlanCreateOptionsQuery = z.infer<
  typeof treatmentPlanCreateOptionsQuerySchema
>;
export type TreatmentPlanCreateOptions = z.infer<
  typeof treatmentPlanCreateOptionsSchema
>;
export const createdTreatmentPlanSchema = treatmentPlanDetailSchema;
