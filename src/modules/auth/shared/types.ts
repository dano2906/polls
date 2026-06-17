import type z from "zod";
import type { createUserSchema } from "../lib/validation";

export type CreateUser = z.infer<typeof createUserSchema>;
