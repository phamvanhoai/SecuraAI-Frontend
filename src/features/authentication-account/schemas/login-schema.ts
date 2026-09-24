import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email không hợp lệ").max(255).transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
