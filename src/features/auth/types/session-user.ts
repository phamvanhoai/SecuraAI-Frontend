import { z } from "zod";

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  status: z.string(),
  mustChangePassword: z.boolean(),
  roles: z.array(z.object({ code: z.string(), name: z.string() })),
  permissions: z.array(z.string()),
});

export type AuthSessionUser = z.infer<typeof sessionUserSchema>;
