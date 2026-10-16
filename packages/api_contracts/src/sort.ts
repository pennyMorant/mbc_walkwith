import { z } from "zod";

export const sortValueSchema = z
  .number()
  .int()
  .min(0)
  .max(2_147_483_647)
  .default(0);

export type SortValue = z.infer<typeof sortValueSchema>;
