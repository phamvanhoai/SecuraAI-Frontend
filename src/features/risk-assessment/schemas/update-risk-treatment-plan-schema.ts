import { z } from "zod";
export const updateRiskTreatmentPlanSchema = z.object({
  title: z.string().trim().min(3).max(255), strategy: z.enum(["avoid", "mitigate", "transfer", "accept"]), ownerUserId: z.string().uuid(), targetDate: z.iso.date(), status: z.enum(["draft", "active", "completed", "cancelled"]), expectedUpdatedAt: z.iso.datetime({ offset: true }),
  actions: z.array(z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(3).max(255), assignedToUserId: z.string().uuid(), dueDate: z.iso.date(), status: z.enum(["pending", "in_progress", "completed", "cancelled"]) })).max(100),
}).superRefine((value, context) => { if (value.strategy !== "accept" && !value.actions.length) context.addIssue({ code: "custom", path: ["actions"], message: "Add at least one action." }); value.actions.forEach((item, index) => { if (item.dueDate > value.targetDate) context.addIssue({ code: "custom", path: ["actions", index, "dueDate"], message: "Action date cannot exceed plan date." }); }); });
export type UpdateRiskTreatmentPlan = z.infer<typeof updateRiskTreatmentPlanSchema>;
