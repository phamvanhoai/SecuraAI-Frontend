import { z } from "zod";

export const riskLevels = ["low", "medium", "high", "critical"] as const;
export const groupingOptions = ["sourceIp", "logSource"] as const;
export const detectionRuleSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9][a-z0-9._-]*$/),
  name: z.string().min(1).max(150),
  eventType: z.string().min(1).max(100),
  threshold: z.number().int().min(1).max(10_000),
  windowSeconds: z.number().int().min(1).max(86_400),
  groupBy: z.enum(groupingOptions),
  severity: z.enum(riskLevels),
  enabled: z.boolean(),
});
export const modelConfigurationSchema = z.object({
  id: z.uuid(),
  modelName: z.string(),
  algorithm: z.string(),
  version: z.string(),
  provider: z.string(),
  modelPath: z.string().nullable(),
  parameters: z.object({
    ollamaModel: z.string(),
    rules: z.array(detectionRuleSchema),
  }),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
});
export const modelConfigurationListSchema = z.object({
  items: z.array(modelConfigurationSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const modelConfigurationFormSchema = z
  .object({
    modelName: z.string().trim().min(1, "Model name is required").max(150),
    algorithm: z.string().trim().min(1, "Algorithm is required").max(100),
    version: z.string().trim().min(1, "Version is required").max(50),
    provider: z.string().trim().min(1, "Provider is required").max(150),
    modelPath: z.union([
      z.literal(""),
      z.url("Enter a valid model URL").max(2000),
    ]),
    ollamaModel: z.string().trim().min(1, "Runtime model is required").max(150),
    rules: z
      .array(detectionRuleSchema)
      .min(1, "Add at least one detection rule")
      .max(100),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();
    value.rules.forEach((rule, index) => {
      if (ids.has(rule.id))
        context.addIssue({
          code: "custom",
          path: ["rules", index, "id"],
          message: "Rule IDs must be unique",
        });
      ids.add(rule.id);
    });
  });
export type DetectionRule = z.infer<typeof detectionRuleSchema>;
export type ModelConfiguration = z.infer<typeof modelConfigurationSchema>;
export type ModelConfigurationList = z.infer<
  typeof modelConfigurationListSchema
>;
export type ModelConfigurationForm = z.infer<
  typeof modelConfigurationFormSchema
>;
