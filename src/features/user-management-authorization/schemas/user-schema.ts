import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .email("Enter a valid email address.")
    .max(255)
    .transform((value) => value.toLowerCase()),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters.")
    .max(150)
    .regex(
      /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u,
      "Full name may contain letters and spaces only.",
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^\d{10}$/.test(value),
      "Phone number must contain exactly 10 digits.",
    ),
  employeeCode: z.string().trim().max(50).refine(
    (value) => value.length === 0 || /^[A-Za-z0-9_-]+$/.test(value),
    "Employee code may contain letters, numbers, hyphens, and underscores only.",
  ),
  departmentId: z.union([z.literal(""), z.uuid("Select a valid department.")]),
  role: z.enum(["SECURITY_OFFICER", "EMPLOYEE", "EXECUTIVE"], {
    error: "Select a role.",
  }),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserPayload = z.output<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(255)
    .regex(
      /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u,
      "Full name may contain letters and spaces only.",
    ),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^\d{10}$/.test(value),
      "Phone number must contain exactly 10 digits.",
    ),
  employeeCode: z.string().trim().max(50).refine(
    (value) => value.length === 0 || /^[A-Za-z0-9_-]+$/.test(value),
    "Employee code may contain letters, numbers, hyphens, and underscores only.",
  ),
  departmentId: z.union([z.literal(""), z.uuid("Select a valid department.")]),
  status: z.enum(["active", "inactive", "locked"]),
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateUserPayload = z.output<typeof updateUserSchema>;

export const createdUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  username: z.string(),
  role: z.enum(["SECURITY_OFFICER", "EMPLOYEE", "EXECUTIVE"]),
  status: z.literal("ACTIVE"),
  message: z.string().optional(),
});

export type CreatedUser = z.infer<typeof createdUserSchema>;

export const userCreateOptionsSchema = z.object({
  departments: z.array(
    z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
  ),
});

export type UserCreateOptions = z.infer<typeof userCreateOptionsSchema>;

const userStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.toLowerCase() : value),
  z.enum(["active", "inactive", "locked", "disabled"]),
);

export const userListItemSchema = z.object({
  id: z.coerce.string(),
  email: z.email(),
  fullName: z.string(),
  employeeCode: z
    .string()
    .nullish()
    .transform((code) => code ?? "Not assigned"),
  status: userStatusSchema,
  department: z
    .object({
      id: z.coerce.string(),
      code: z.string(),
      name: z.string(),
    })
    .nullish(),
  roles: z
    .array(z.object({ code: z.string(), name: z.string() }))
    .nullish()
    .transform((roles) => roles ?? []),
});

export const userListResponseSchema = z.object({
  items: z.array(userListItemSchema),
  pagination: z.object({
    page: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().positive(),
    total: z.coerce.number().int().nonnegative(),
    totalPages: z.coerce.number().int().nonnegative(),
  }),
  summary: z.object({
    active: z.coerce.number().int().nonnegative(),
    inactive: z.coerce.number().int().nonnegative(),
    locked: z.coerce.number().int().nonnegative(),
    disabled: z.coerce.number().int().nonnegative(),
  }),
});

export type UserListQuery = {
  page: number;
  limit: number;
  q?: string;
  departmentId?: string;
  roleCode?: string;
  status?: z.infer<typeof userStatusSchema>;
};

export type UserListResponse = z.infer<typeof userListResponseSchema>;
export const userDetailSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  fullName: z.string(),
  phone: z.string().nullish().transform((value) => value ?? null),
  employeeCode: z.string().nullish().transform((value) => value ?? null),
  department: z
    .object({ id: z.uuid(), code: z.string(), name: z.string() })
    .nullish()
    .transform((value) => value ?? null),
  role: z.object({ code: z.string(), name: z.string() }),
  status: userStatusSchema,
  googleConnected: z.boolean(),
  lastLoginAt: z.iso.datetime().nullable(),
  passwordChangedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserDetail = z.infer<typeof userDetailSchema>;
