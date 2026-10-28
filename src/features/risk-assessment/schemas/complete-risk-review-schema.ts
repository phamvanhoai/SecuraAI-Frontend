import { z } from "zod";
export const completeRiskReviewSchema = z.object({
  conclusion: z.string().trim().min(10, "Enter a review conclusion (at least 10 characters).").max(2000),
  nextReviewDate: z.iso.date(), expectedUpdatedAt: z.iso.datetime({ offset: true }),
  expectedOpenedAt: z.iso.datetime({ offset: true }), assessmentId: z.uuid(),
}).strict();
