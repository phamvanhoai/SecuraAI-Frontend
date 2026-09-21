import { z } from "zod";
import { treatmentPlanDetailSchema } from "./treatment-plan-detail-schema";

const text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max).transform((value) => value.normalize("NFKC").replace(/\s+/gu, " "));
const optionalText = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(2000).optional());

export const updateTreatmentPlanSchema = z.object({
  strategy: z.enum(["avoid", "mitigate", "transfer", "accept"]),
  description: text(10, 5000, "Description must contain at least 10 characters."),
  ownerUserId: z.uuid("Select a plan owner."),
  targetDate: z.iso.date("Select a valid target date."),
  actions: z.array(z.object({
    id: z.uuid().optional(), title: text(3, 255, "Action title must contain at least 3 characters."),
    description: optionalText, assignedToUserId: z.uuid("Select an assignee."), dueDate: z.iso.date("Select a valid due date."),
  })).max(100),
}).superRefine((value, context) => {
  if (value.strategy !== "accept" && value.actions.length === 0)
    context.addIssue({ code: "custom", path: ["actions"], message: "This strategy requires at least one action." });
  const titles = new Set<string>();
  value.actions.forEach((action, index) => {
    const key = action.title.toLocaleLowerCase("en-US");
    if (titles.has(key)) context.addIssue({ code: "custom", path: ["actions", index, "title"], message: "Action titles must be unique." });
    titles.add(key);
    if (action.dueDate > value.targetDate) context.addIssue({ code: "custom", path: ["actions", index, "dueDate"], message: "Due date must not be after the target date." });
  });
});
export const updateTreatmentPlanRequestSchema = updateTreatmentPlanSchema.extend({ expectedUpdatedAt: z.iso.datetime({ offset: true }) });
export const updatedTreatmentPlanSchema = treatmentPlanDetailSchema;
export type UpdateTreatmentPlanInput = z.input<typeof updateTreatmentPlanSchema>;
export type UpdateTreatmentPlanForm = z.infer<typeof updateTreatmentPlanSchema>;
export type UpdateTreatmentPlanRequest = z.infer<typeof updateTreatmentPlanRequestSchema>;
