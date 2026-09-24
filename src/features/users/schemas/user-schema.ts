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
    .max(150),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => value.length === 0 || value.length >= 3,
      "Phone number must contain at least 3 characters.",
    )
    .optional(),
  employeeCode: z.string().trim().min(1, "Employee code is required.").max(50),
  departmentId: z.uuid("Select a department."),
  roleCodes: z.array(z.string()).min(1, "Select at least one role.").max(10),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserPayload = z.output<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => value.length === 0 || value.length >= 3,
      "Phone number must contain at least 3 characters.",
    ),
  employeeCode: z.string().trim().max(50),
  departmentId: z.union([z.literal(""), z.uuid("Select a valid department.")]),
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateUserPayload = z.output<typeof updateUserSchema>;

export const createdUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  message: z.string().optional(),
});

export type CreatedUser = z.infer<typeof createdUserSchema>;

export const userCreateOptionsSchema = z.object({
  departments: z.array(
    z.object({ id: z.uuid(), code: z.string(), name: z.string() }),
  ),
  roles: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      isSystem: z.boolean(),
    }),
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
  fullName: z.string(),
  phone: z.string().nullable(),
  employeeCode: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
  emailVerifiedAt: z.iso.datetime().nullable(),
  lastLoginAt: z.iso.datetime().nullable(),
  lastLockedAt: z.iso.datetime().nullable(),
  disabledAt: z.iso.datetime().nullable(),
  mfaEnabled: z.boolean(),
  department: z
    .object({ id: z.uuid(), code: z.string(), name: z.string() })
    .nullable(),
  roles: z.array(
    z.object({
      id: z.uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      assignedAt: z.iso.datetime(),
    }),
  ),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserDetail = z.infer<typeof userDetailSchema>;
