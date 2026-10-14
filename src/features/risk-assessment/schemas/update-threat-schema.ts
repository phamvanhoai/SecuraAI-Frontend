import { z } from "zod";
import { identifiedThreatSchema, identifyThreatSchema } from "./identify-threat-schema";

export const updateThreatSchema = identifyThreatSchema.extend({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const updatedThreatSchema = identifiedThreatSchema.extend({
  assessmentReviewRequired: z.boolean(),
});

export type UpdateThreatInput = z.infer<typeof updateThreatSchema>;
export type UpdatedThreat = z.infer<typeof updatedThreatSchema>;
