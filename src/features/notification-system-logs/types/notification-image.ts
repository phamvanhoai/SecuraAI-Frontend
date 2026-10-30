import { z } from "zod";
export const notificationImageSchema = z
  .object({
    name: z.string().trim().min(5).max(120).refine((name) =>
      name.toLowerCase().endsWith(".png") && !name.includes("/") && !name.includes(String.fromCharCode(92)) &&
      Array.from(name).every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)),
    dataUrl: z
      .string()
      .max(262166)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/u),
  })
  .strict();
export const notificationImagesSchema = z
  .array(notificationImageSchema)
  .max(3)
  .optional();
export type NotificationImage = z.infer<typeof notificationImageSchema>;
export type NotificationImageReference = { name: string; index: number };
