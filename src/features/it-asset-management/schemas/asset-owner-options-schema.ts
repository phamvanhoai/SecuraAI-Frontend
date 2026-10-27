import { z } from "zod";
export const assetOwnerOptionsSchema = z.object({ items: z.array(z.object({ id: z.uuid(), fullName: z.string(), email: z.email() })) });
