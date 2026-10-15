import { z } from "zod";

export const createRiskTreatmentPlanSchema = z
  .object({
    riskId: z.string().uuid(),
    title: z.string().trim().min(3).max(255),
    strategy: z.enum(["avoid", "mitigate", "transfer", "accept"]),
    ownerUserId: z.string().uuid(),
    targetDate: z.iso.date(),
    targetRisk: z.enum(["low", "medium", "high", "critical"]),
    controlIds: z.array(z.string().uuid()).max(100),
    actions: z
      .array(
        z.object({
          title: z.string().trim().min(3).max(255),
          description: z.string().trim().max(2000).optional(),
          assignedToUserId: z.string().uuid(),
          dueDate: z.iso.date(),
        }),
      )
      .max(100),
  })
  .superRefine((value, context) => {
    if (value.strategy === "mitigate" && !value.controlIds.length)
      context.addIssue({
        code: "custom",
        path: ["controlIds"],
        message: "Mitigation plans require at least one related Control.",
      });
    if (new Set(value.controlIds).size !== value.controlIds.length)
      context.addIssue({
        code: "custom",
        path: ["controlIds"],
        message: "Control IDs must be unique.",
      });
    const titles = value.actions.map((item) =>
      item.title.normalize("NFKC").replace(/\s+/g, " ").toLowerCase(),
    );
    if (new Set(titles).size !== titles.length)
      context.addIssue({
        code: "custom",
        path: ["actions"],
        message: "Action titles must be unique.",
      });
    if (value.strategy !== "accept" && value.actions.length === 0)
      context.addIssue({
        code: "custom",
        path: ["actions"],
        message: "Add at least one treatment action.",
      });
    value.actions.forEach((action, index) => {
      if (action.dueDate > value.targetDate)
        context.addIssue({
          code: "custom",
          path: ["actions", index, "dueDate"],
          message: "Action date cannot exceed the plan due date.",
        });
    });
  });
export type CreateRiskTreatmentPlan = z.infer<
  typeof createRiskTreatmentPlanSchema
>;

export const treatmentPlanOptionsSchema = z.object({
  users: z.array(
    z.object({
      id: z.string().uuid(),
      fullName: z.string(),
      email: z.string().email(),
    }),
  ),
  controls: z.array(
    z.object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      implementationStatus: z.string(),
    }),
  ),
});
export type TreatmentPlanOptions = z.infer<typeof treatmentPlanOptionsSchema>;
