import { z } from "zod";

export const loginHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(255).optional(),
    status: z.enum(["success", "failed"]).optional(),
    userId: z.uuid().optional(),
    ipAddress: z.union([z.ipv4(), z.ipv6()]).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    sortBy: z.literal("loginTime").default("loginTime"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .refine(
    (query) =>
      !query.from ||
      !query.to ||
      Date.parse(query.from) <= Date.parse(query.to),
    {
      message: "Start time must be on or before end time.",
      path: ["to"],
    },
  );

export const loginHistoryItemSchema = z.object({
  id: z.uuid(),
  userId: z.uuid().nullable(),
  userName: z.string().nullable(),
  email: z.string(),
  loginTime: z.iso.datetime({ offset: true }),
  status: z.enum(["success", "failed"]),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  failureReason: z.string().nullable(),
});
export const loginHistoryListSchema = z.object({
  items: z.array(loginHistoryItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export type LoginHistoryQuery = z.infer<typeof loginHistoryQuerySchema>;
export type LoginHistoryItem = z.infer<typeof loginHistoryItemSchema>;
export type LoginHistoryList = z.infer<typeof loginHistoryListSchema>;
