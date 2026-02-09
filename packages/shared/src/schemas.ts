import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
});

export type RegisterInput = z.infer<typeof registerSchema>;
