import { z } from "zod";

const policyCodeSchema = z
  .string()
  .trim()
  .min(2, "Mã chính sách phải có ít nhất 2 ký tự.")
  .max(50, "Mã chính sách không được vượt quá 50 ký tự.")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Mã chỉ được chứa chữ, số, dấu chấm, gạch dưới và gạch ngang.",
  )
  .transform((value) => value.toUpperCase());

export const createPolicyDraftSchema = z.object({
  policyCode: policyCodeSchema,
  title: z
    .string()
    .trim()
    .min(3, "Tên chính sách phải có ít nhất 3 ký tự.")
    .max(255, "Tên chính sách không được vượt quá 255 ký tự."),
  description: z
    .string()
    .trim()
    .max(2_000, "Mô tả không được vượt quá 2.000 ký tự.")
    .optional(),
  versionNumber: z
    .string()
    .trim()
    .min(1, "Phiên bản là bắt buộc.")
    .max(30, "Phiên bản không được vượt quá 30 ký tự."),
  content: z
    .string()
    .trim()
    .min(1, "Nội dung chính sách là bắt buộc.")
    .max(500_000, "Nội dung chính sách quá dài."),
});

export const updatePolicyDraftSchema = createPolicyDraftSchema
  .omit({ policyCode: true })
  .extend({
    description: z
      .string()
      .trim()
      .max(2_000, "Mô tả không được vượt quá 2.000 ký tự.")
      .nullable()
      .optional(),
    changeSummary: z
      .string()
      .trim()
      .max(5_000, "Tóm tắt thay đổi không được vượt quá 5.000 ký tự.")
      .nullable()
      .optional(),
  });

export const policyDraftQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ownedPolicyDraftSchema = z.object({
  policyId: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  policyStatus: z.string(),
  version: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    changeSummary: z.string().nullable(),
    status: z.string(),
    createdByUserId: z.uuid().nullable(),
    createdAt: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const policyDraftListSchema = z.object({
  items: z.array(ownedPolicyDraftSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const createdPolicyDraftSchema = z.object({
  id: z.uuid(),
  policyCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  ownerUserId: z.uuid().nullable(),
  status: z.string(),
  currentVersion: z.object({
    id: z.uuid(),
    versionNumber: z.string(),
    content: z.string(),
    status: z.string(),
    createdAt: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreatePolicyDraftInput = z.input<typeof createPolicyDraftSchema>;
export type CreatePolicyDraftRequest = z.output<typeof createPolicyDraftSchema>;
export type UpdatePolicyDraftInput = z.input<typeof updatePolicyDraftSchema>;
export type UpdatePolicyDraftRequest = z.output<typeof updatePolicyDraftSchema>;
export type PolicyDraftQuery = z.infer<typeof policyDraftQuerySchema>;
export type OwnedPolicyDraft = z.infer<typeof ownedPolicyDraftSchema>;
export type PolicyDraftList = z.infer<typeof policyDraftListSchema>;
export type CreatedPolicyDraft = z.infer<typeof createdPolicyDraftSchema>;
