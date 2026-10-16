import { z } from "zod";

export const positionValueSchema = z
  .number()
  .int()
  .nonnegative()
  .default(0);

export type PositionValue = z.infer<typeof positionValueSchema>;
